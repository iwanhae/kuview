import { useState } from "react";
import { PodWaffleChart } from "@/components/block/pod-waffle-chart";
import { useKuview } from "@/hooks/useKuview";
import type { KubernetesObject } from "@/lib/kuview";

// Extended types for Pod resources
interface PodStatus {
  phase?: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }>;
  containerStatuses?: Array<{
    name: string;
    ready: boolean;
    restartCount: number;
    state?: {
      running?: { startedAt: string };
      waiting?: { reason: string; message?: string };
      terminated?: { reason: string; exitCode: number; message?: string };
    };
  }>;
  podIP?: string;
  hostIP?: string;
  startTime?: string;
}

interface PodSpec {
  nodeName?: string;
  containers?: Array<{
    name: string;
    image: string;
    resources?: {
      requests?: Record<string, string>;
      limits?: Record<string, string>;
    };
    ports?: Array<{
      containerPort: number;
      protocol?: string;
      name?: string;
    }>;
  }>;
  restartPolicy?: string;
  serviceAccountName?: string;
}

// Helper function to parse resource quantities
function parseResourceQuantity(quantity: string): number {
  if (!quantity) return 0;

  const units: Record<string, number> = {
    m: 0.001,
    Ki: 1024,
    Mi: 1024 * 1024,
    Gi: 1024 * 1024 * 1024,
    Ti: 1024 * 1024 * 1024 * 1024,
  };

  for (const [unit, multiplier] of Object.entries(units)) {
    if (quantity.endsWith(unit)) {
      return parseFloat(quantity.slice(0, -unit.length)) * multiplier;
    }
  }

  return parseFloat(quantity) || 0;
}

// Helper function to format resource quantities
function formatResourceQuantity(
  quantity: number,
  type: "cpu" | "memory",
): string {
  if (type === "cpu") {
    if (quantity < 1) {
      return `${Math.round(quantity * 1000)}m`;
    }
    return `${quantity.toFixed(1)}`;
  } else {
    if (quantity >= 1024 * 1024 * 1024) {
      return `${(quantity / (1024 * 1024 * 1024)).toFixed(1)}Gi`;
    } else if (quantity >= 1024 * 1024) {
      return `${(quantity / (1024 * 1024)).toFixed(1)}Mi`;
    } else if (quantity >= 1024) {
      return `${(quantity / 1024).toFixed(1)}Ki`;
    }
    return `${quantity}`;
  }
}

// Pod Basic Info Card Component
function PodBasicInfoCard({ pod }: { pod: KubernetesObject }) {
  const spec = pod.spec as PodSpec;
  const status = pod.status as PodStatus;

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Namespace:</span>{" "}
            <span className="font-medium">
              {pod.metadata?.namespace || "default"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Node:</span>{" "}
            <span className="font-medium">{spec?.nodeName || "N/A"}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Pod IP:</span>{" "}
            <span className="font-medium">{status?.podIP || "N/A"}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Host IP:</span>{" "}
            <span className="font-medium">{status?.hostIP || "N/A"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Phase:</span>{" "}
            <span
              className={`font-medium px-2 py-1 rounded text-xs ${
                status?.phase === "Running"
                  ? "bg-green-100 text-green-800"
                  : status?.phase === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : status?.phase === "Failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {status?.phase || "Unknown"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Restart Policy:</span>{" "}
            <span className="font-medium">
              {spec?.restartPolicy || "Always"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Service Account:</span>{" "}
            <span className="font-medium">
              {spec?.serviceAccountName || "default"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Started:</span>{" "}
            <span className="font-medium">
              {status?.startTime
                ? new Date(status.startTime).toLocaleString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pod Status Card Component
function PodStatusCard({ pod }: { pod: KubernetesObject }) {
  const status = pod.status as PodStatus;
  const conditions = status?.conditions || [];

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Pod Conditions</h3>
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-2 bg-background/50 rounded border"
          >
            <div className="flex flex-col">
              <span className="font-medium">{condition.type}</span>
              {condition.reason && (
                <span className="text-xs text-gray-500">
                  {condition.reason}
                </span>
              )}
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                condition.status === "True"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {condition.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Container Info Card Component
function ContainerInfoCard({ pod }: { pod: KubernetesObject }) {
  const spec = pod.spec as PodSpec;
  const status = pod.status as PodStatus;
  const containers = spec?.containers || [];
  const containerStatuses = status?.containerStatuses || [];

  // Calculate total resource requests and limits
  let totalRequestsCpu = 0;
  let totalRequestsMemory = 0;
  let totalLimitsCpu = 0;
  let totalLimitsMemory = 0;

  containers.forEach((container) => {
    const resources = container.resources;
    if (resources?.requests) {
      totalRequestsCpu += parseResourceQuantity(resources.requests.cpu || "0");
      totalRequestsMemory += parseResourceQuantity(
        resources.requests.memory || "0",
      );
    }
    if (resources?.limits) {
      totalLimitsCpu += parseResourceQuantity(resources.limits.cpu || "0");
      totalLimitsMemory += parseResourceQuantity(
        resources.limits.memory || "0",
      );
    }
  });

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Containers</h3>

      {/* Resource Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">CPU Requests</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalRequestsCpu, "cpu")}
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">Memory Requests</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalRequestsMemory, "memory")}
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">CPU Limits</div>
          <div className="text-lg font-bold">
            {totalLimitsCpu > 0
              ? formatResourceQuantity(totalLimitsCpu, "cpu")
              : "None"}
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">Memory Limits</div>
          <div className="text-lg font-bold">
            {totalLimitsMemory > 0
              ? formatResourceQuantity(totalLimitsMemory, "memory")
              : "None"}
          </div>
        </div>
      </div>

      {/* Container Details */}
      <div className="space-y-3">
        {containers.map((container, index) => {
          const containerStatus = containerStatuses.find(
            (cs) => cs.name === container.name,
          );
          return (
            <div key={index} className="bg-background/50 rounded-lg p-3 border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{container.name}</h4>
                  <p className="text-sm text-gray-500">{container.image}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      containerStatus?.ready
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {containerStatus?.ready ? "Ready" : "Not Ready"}
                  </span>
                  {containerStatus && (
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                      Restarts: {containerStatus.restartCount || 0}
                    </span>
                  )}
                </div>
              </div>

              {/* Container Resources */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Requests:</span>{" "}
                  {container.resources?.requests?.cpu && (
                    <span>CPU: {container.resources.requests.cpu} </span>
                  )}
                  {container.resources?.requests?.memory && (
                    <span>Memory: {container.resources.requests.memory}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">Limits:</span>{" "}
                  {container.resources?.limits?.cpu && (
                    <span>CPU: {container.resources.limits.cpu} </span>
                  )}
                  {container.resources?.limits?.memory && (
                    <span>Memory: {container.resources.limits.memory}</span>
                  )}
                </div>
              </div>

              {/* Container Ports */}
              {container.ports && container.ports.length > 0 && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Ports:</span>{" "}
                  {container.ports.map((port, portIndex) => (
                    <span
                      key={portIndex}
                      className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mr-1"
                    >
                      {port.containerPort}
                      {port.protocol ? `/${port.protocol}` : ""}
                      {port.name && ` (${port.name})`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Pod() {
  const pods = useKuview("v1/Pod");

  const [selectedPodKey, setSelectedPodKey] = useState<string | null>(null);

  const podEntries = Object.entries(pods);
  const selectedPod = selectedPodKey ? pods[selectedPodKey] : null;

  const handlePodClick = (podKey: string) => {
    setSelectedPodKey(podKey === selectedPodKey ? null : podKey);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <h1 className="text-2xl font-bold">Pod Overview</h1>
      </div>

      {podEntries.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No pods found or events not yet received.
          </p>
        </div>
      ) : (
        <>
          {/* Pod Waffle Chart */}
          <PodWaffleChart
            pods={podEntries}
            selectedPod={selectedPodKey}
            onPodClick={handlePodClick}
          />

          {/* Pod Details */}
          {selectedPod && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-blue-800">
                  🚀 {selectedPod.metadata.name} - Detailed Information
                </h2>
                <p className="text-sm text-blue-600">
                  Namespace: {selectedPod.metadata?.namespace || "default"}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PodBasicInfoCard pod={selectedPod} />
                <PodStatusCard pod={selectedPod} />
              </div>

              <ContainerInfoCard pod={selectedPod} />
            </div>
          )}

          {/* Show instruction when no pod is selected */}
          {!selectedPod && (
            <div className="bg-muted/50 rounded-xl p-8 text-center">
              <p className="text-gray-500">
                👆 Click on a pod block above to view detailed information
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

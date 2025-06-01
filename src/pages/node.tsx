import Treemap from "@/components/ui/treemap";
import { useKuview } from "@/hooks/useKuview";
import type { KubernetesObject, NodeObject, PodObject } from "@/lib/kuview";

// Extended types for Node and Pod resources
interface NodeInfo {
  architecture?: string;
  kernelVersion?: string;
  kubeProxyVersion?: string;
  kubeletVersion?: string;
  operatingSystem?: string;
  osImage?: string;
}

interface NodeCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

interface NodeAddress {
  type: string;
  address: string;
}

interface NodeStatus {
  nodeInfo?: NodeInfo;
  conditions?: NodeCondition[];
  addresses?: NodeAddress[];
  capacity?: Record<string, string>;
  allocatable?: Record<string, string>;
}

interface PodStatus {
  phase?: string;
}

interface PodSpec {
  nodeName?: string;
  containers?: Array<{
    name: string;
    resources?: {
      requests?: Record<string, string>;
      limits?: Record<string, string>;
    };
  }>;
}

// Helper function to parse resource quantities (e.g., "100m" -> 0.1, "1Gi" -> 1073741824)
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

// Helper function to calculate pod resource usage
function calculatePodResources(pod: KubernetesObject) {
  const spec = pod.spec as PodSpec;
  const containers = spec?.containers || [];

  let requestsCpu = 0;
  let requestsMemory = 0;
  let limitsCpu = 0;
  let limitsMemory = 0;

  containers.forEach((container) => {
    const resources = container.resources;
    if (resources?.requests) {
      requestsCpu += parseResourceQuantity(resources.requests.cpu || "0");
      requestsMemory += parseResourceQuantity(resources.requests.memory || "0");
    }
    if (resources?.limits) {
      limitsCpu += parseResourceQuantity(resources.limits.cpu || "0");
      limitsMemory += parseResourceQuantity(resources.limits.memory || "0");
    }
  });

  return { requestsCpu, requestsMemory, limitsCpu, limitsMemory };
}

// Node Info Card Component
function NodeInfoCard({ node }: { node: KubernetesObject }) {
  const nodeInfo = (node.status as NodeStatus)?.nodeInfo;

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Node Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Architecture:</span>{" "}
            <span className="font-medium">
              {nodeInfo?.architecture || "N/A"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">OS:</span>{" "}
            <span className="font-medium">
              {nodeInfo?.operatingSystem || "N/A"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">OS Image:</span>{" "}
            <span className="font-medium">{nodeInfo?.osImage || "N/A"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Kernel:</span>{" "}
            <span className="font-medium">
              {nodeInfo?.kernelVersion || "N/A"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Kubelet:</span>{" "}
            <span className="font-medium">
              {nodeInfo?.kubeletVersion || "N/A"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Kube-proxy:</span>{" "}
            <span className="font-medium">
              {nodeInfo?.kubeProxyVersion || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Node Status Card Component
function NodeStatusCard({ node }: { node: KubernetesObject }) {
  const nodeStatus = node.status as NodeStatus;
  const conditions = nodeStatus?.conditions || [];
  const addresses = nodeStatus?.addresses || [];

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Node Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Conditions</h4>
          <div className="space-y-1">
            {conditions.map((condition, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{condition.type}</span>
                <span
                  className={
                    condition.status === "True"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {condition.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Addresses</h4>
          <div className="space-y-1">
            {addresses.map((address, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-500">{address.type}:</span>{" "}
                <span className="font-medium">{address.address}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Node Capacity Card Component
function NodeCapacityCard({ node }: { node: KubernetesObject }) {
  const nodeStatus = node.status as NodeStatus;
  const capacity = nodeStatus?.capacity || {};

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Hardware Capacity</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {parseResourceQuantity(capacity.cpu || "0").toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">CPU Cores</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatResourceQuantity(
              parseResourceQuantity(capacity.memory || "0"),
              "memory",
            )}
          </div>
          <div className="text-sm text-gray-500">Memory</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {capacity.pods || "0"}
          </div>
          <div className="text-sm text-gray-500">Max Pods</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {formatResourceQuantity(
              parseResourceQuantity(capacity["ephemeral-storage"] || "0"),
              "memory",
            )}
          </div>
          <div className="text-sm text-gray-500">Storage</div>
        </div>
      </div>
    </div>
  );
}

// Pod Resource Usage Component
function PodResourceUsage({
  node,
  pods,
}: {
  node: NodeObject;
  pods: PodObject[];
}) {
  const nodeStatus = node.status as NodeStatus;
  const capacity = nodeStatus?.capacity || {};
  const capacityCpu = parseResourceQuantity(capacity.cpu || "0");
  const capacityMemory = parseResourceQuantity(capacity.memory || "0");

  // Calculate total resource usage
  let totalRequestsCpu = 0;
  let totalRequestsMemory = 0;
  let totalLimitsCpu = 0;
  let totalLimitsMemory = 0;

  pods.forEach((pod) => {
    const resources = calculatePodResources(pod);
    totalRequestsCpu += resources.requestsCpu;
    totalRequestsMemory += resources.requestsMemory;
    totalLimitsCpu += resources.limitsCpu;
    totalLimitsMemory += resources.limitsMemory;
  });

  // Pod status statistics
  const statusCounts = pods.reduce(
    (acc, pod) => {
      const phase = (pod.status as PodStatus)?.phase || "Unknown";
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Pod Resource Usage</h3>

      {/* Resource Usage Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">CPU Requests</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalRequestsCpu, "cpu")} /{" "}
            {formatResourceQuantity(capacityCpu, "cpu")}
          </div>
          <div className="text-xs text-gray-500">
            {((totalRequestsCpu / capacityCpu) * 100).toFixed(1)}% used
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">Memory Requests</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalRequestsMemory, "memory")} /{" "}
            {formatResourceQuantity(capacityMemory, "memory")}
          </div>
          <div className="text-xs text-gray-500">
            {((totalRequestsMemory / capacityMemory) * 100).toFixed(1)}% used
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">CPU Limits</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalLimitsCpu, "cpu")} /{" "}
            {formatResourceQuantity(capacityCpu, "cpu")}
          </div>
          <div className="text-xs text-gray-500">
            {totalLimitsCpu > 0
              ? ((totalLimitsCpu / capacityCpu) * 100).toFixed(1)
              : "0"}
            % limit
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border">
          <div className="text-sm text-gray-500">Memory Limits</div>
          <div className="text-lg font-bold">
            {formatResourceQuantity(totalLimitsMemory, "memory")} /{" "}
            {formatResourceQuantity(capacityMemory, "memory")}
          </div>
          <div className="text-xs text-gray-500">
            {totalLimitsMemory > 0
              ? ((totalLimitsMemory / capacityMemory) * 100).toFixed(1)
              : "0"}
            % limit
          </div>
        </div>
      </div>

      {/* Pod Status Statistics */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">
          Pod Status Summary ({pods.length} total)
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const colorMap: Record<string, string> = {
              Running: "bg-green-100 text-green-800",
              Pending: "bg-yellow-100 text-yellow-800",
              Failed: "bg-red-100 text-red-800",
              Succeeded: "bg-blue-100 text-blue-800",
              Unknown: "bg-gray-100 text-gray-800",
            };
            return (
              <span
                key={status}
                className={`px-2 py-1 rounded text-xs font-medium ${colorMap[status] || "bg-gray-100 text-gray-800"}`}
              >
                {status}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Pod List */}
      <div className="space-y-2">
        <Treemap
          items={pods.map((pod) => ({
            name: pod.metadata.name,
            value:
              pod.spec.containers?.reduce((acc, container) => {
                return (
                  acc +
                  parseResourceQuantity(
                    container.resources?.requests?.memory || "0",
                  )
                );
              }, 0) || 0,
            href: `/node/${pod.metadata.name}`,
          }))}
          width={800}
          height={500}
        />
      </div>
    </div>
  );
}

export default function Node() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");

  const nodeEntries = Object.entries(nodes);

  // Group nodes by hardware specs (CPU and Memory capacity)
  const nodeGroups = nodeEntries.reduce(
    (groups, [key, node]) => {
      const capacity = (node.status as NodeStatus)?.capacity || {};
      const groupKey = `${capacity.cpu || "0"}-${capacity.memory || "0"}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push([key, node]);
      return groups;
    },
    {} as Record<string, Array<[string, NodeObject]>>,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🖥️</span>
        <h1 className="text-2xl font-bold">Node Overview</h1>
      </div>

      {nodeEntries.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No nodes found or events not yet received.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(nodeGroups).map(([groupKey, groupNodes]) => {
            const [cpu, memory] = groupKey.split("-");
            return (
              <div key={groupKey} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h2 className="text-lg font-semibold text-blue-800">
                    Hardware Group: {parseResourceQuantity(cpu).toFixed(1)} CPU,{" "}
                    {formatResourceQuantity(
                      parseResourceQuantity(memory),
                      "memory",
                    )}{" "}
                    Memory
                    <span className="text-sm font-normal text-blue-600 ml-2">
                      ({groupNodes.length} nodes)
                    </span>
                  </h2>
                </div>

                {groupNodes.map(([key, node]) => {
                  const nodePods = Object.values(pods).filter(
                    (pod) =>
                      (pod.spec as PodSpec)?.nodeName === node.metadata.name,
                  );

                  return (
                    <div
                      key={key}
                      className="space-y-4 border-l-4 border-blue-200 pl-4"
                    >
                      <h3 className="text-xl font-semibold text-gray-800">
                        📍 {node.metadata.name}
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <NodeInfoCard node={node} />
                        <NodeStatusCard node={node} />
                      </div>

                      <NodeCapacityCard node={node} />

                      <PodResourceUsage node={node} pods={nodePods} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useKuview } from "@/hooks/useKuview";
import type { KubernetesObject } from "@/lib/kuview";

// Extended types for specific resource properties
interface NodeCondition {
  type: string;
  status: string;
}

interface NodeStatus {
  conditions?: NodeCondition[];
}

interface PodStatus {
  phase?: string;
}

interface PodSpec {
  nodeName?: string;
}

interface ServiceSpec {
  type?: string;
}

// Helper function to get resource status color
function getStatusColor(
  resource: KubernetesObject,
  resourceType: string,
): string {
  if (resourceType === "Node") {
    const conditions = (resource.status as NodeStatus)?.conditions || [];
    const readyCondition = conditions.find(
      (c: NodeCondition) => c.type === "Ready",
    );
    return readyCondition?.status === "True"
      ? "text-green-600"
      : "text-red-600";
  }

  if (resourceType === "Pod") {
    const phase = (resource.status as PodStatus)?.phase;
    switch (phase) {
      case "Running":
        return "text-green-600";
      case "Pending":
        return "text-yellow-600";
      case "Failed":
        return "text-red-600";
      case "Succeeded":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  }

  return "text-gray-600";
}

// Helper function to get resource status text
function getStatusText(
  resource: KubernetesObject,
  resourceType: string,
): string {
  if (resourceType === "Node") {
    const conditions = (resource.status as NodeStatus)?.conditions || [];
    const readyCondition = conditions.find(
      (c: NodeCondition) => c.type === "Ready",
    );
    return readyCondition?.status === "True" ? "Ready" : "NotReady";
  }

  if (resourceType === "Pod") {
    return (resource.status as PodStatus)?.phase || "Unknown";
  }

  return "Active";
}

// ResourceCard component for displaying a resource type
function ResourceCard({
  title,
  resources,
  resourceType,
  icon,
}: {
  title: string;
  resources: Record<string, KubernetesObject>;
  resourceType: string;
  icon: string;
}) {
  const resourceEntries = Object.entries(resources);

  return (
    <div className="bg-muted/50 aspect-video rounded-xl p-4 overflow-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-semibold">
          {title} ({resourceEntries.length})
        </h2>
      </div>
      {resourceEntries.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {title.toLowerCase()} found or events not yet received.
        </p>
      ) : (
        <div className="space-y-2">
          {resourceEntries.slice(0, 10).map(([key, resource]) => (
            <div key={key} className="bg-background/50 rounded-lg p-3 border">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {resource.metadata.name}
                  </div>
                  {resource.metadata.namespace && (
                    <div className="text-xs text-gray-500 truncate">
                      ns: {resource.metadata.namespace}
                    </div>
                  )}
                </div>
                <div
                  className={`text-xs font-medium ${getStatusColor(resource, resourceType)}`}
                >
                  {getStatusText(resource, resourceType)}
                </div>
              </div>
              {resourceType === "Pod" &&
                (resource.spec as PodSpec)?.nodeName && (
                  <div className="text-xs text-gray-500 mt-1">
                    Node: {(resource.spec as PodSpec).nodeName}
                  </div>
                )}
              {resourceType === "Service" &&
                (resource.spec as ServiceSpec)?.type && (
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {(resource.spec as ServiceSpec).type}
                  </div>
                )}
            </div>
          ))}
          {resourceEntries.length > 10 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{resourceEntries.length - 10} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Root() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");
  const namespaces = useKuview("v1/Namespace");
  const services = useKuview("v1/Service");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Resource Overview Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ResourceCard
          title="Nodes"
          resources={nodes}
          resourceType="Node"
          icon="🖥️"
        />
        <ResourceCard
          title="Pods"
          resources={pods}
          resourceType="Pod"
          icon="📦"
        />
        <ResourceCard
          title="Namespaces"
          resources={namespaces}
          resourceType="Namespace"
          icon="📁"
        />
        <ResourceCard
          title="Services"
          resources={services}
          resourceType="Service"
          icon="🌐"
        />
      </div>

      {/* Summary Statistics */}
      <div className="bg-muted/50 rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Cluster Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(nodes).length}
            </div>
            <div className="text-sm text-gray-500">Total Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {
                Object.values(pods).filter(
                  (pod: KubernetesObject) =>
                    (pod.status as PodStatus)?.phase === "Running",
                ).length
              }
            </div>
            <div className="text-sm text-gray-500">Running Pods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(namespaces).length}
            </div>
            <div className="text-sm text-gray-500">Namespaces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(services).length}
            </div>
            <div className="text-sm text-gray-500">Services</div>
          </div>
        </div>
      </div>

      {/* Resource Health Status */}
      <div className="bg-muted/50 rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Resource Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node Health */}
          <div className="bg-background/50 rounded-lg p-3 border">
            <h3 className="font-medium text-sm mb-2">Node Status</h3>
            <div className="space-y-1">
              {Object.values(nodes).map((node: KubernetesObject) => {
                const conditions =
                  (node.status as NodeStatus)?.conditions || [];
                const readyCondition = conditions.find(
                  (c: NodeCondition) => c.type === "Ready",
                );
                const isReady = readyCondition?.status === "True";
                return (
                  <div
                    key={node.metadata.uid}
                    className="flex justify-between text-xs"
                  >
                    <span className="truncate">{node.metadata.name}</span>
                    <span
                      className={isReady ? "text-green-600" : "text-red-600"}
                    >
                      {isReady ? "✓ Ready" : "✗ NotReady"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pod Health */}
          <div className="bg-background/50 rounded-lg p-3 border">
            <h3 className="font-medium text-sm mb-2">Pod Status Summary</h3>
            <div className="space-y-1">
              {["Running", "Pending", "Failed", "Succeeded"].map((phase) => {
                const count = Object.values(pods).filter(
                  (pod: KubernetesObject) =>
                    (pod.status as PodStatus)?.phase === phase,
                ).length;
                const colorMap: Record<string, string> = {
                  Running: "text-green-600",
                  Pending: "text-yellow-600",
                  Failed: "text-red-600",
                  Succeeded: "text-blue-600",
                };
                return (
                  <div key={phase} className="flex justify-between text-xs">
                    <span>{phase}</span>
                    <span className={colorMap[phase]}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { KubernetesObject } from "@/lib/kuview";

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

interface NodeStatus {
  nodeInfo?: NodeInfo;
  conditions?: NodeCondition[];
  addresses?: Array<{ type: string; address: string }>;
  capacity?: Record<string, string>;
  allocatable?: Record<string, string>;
}

interface WaffleChartProps {
  nodes: Array<[string, KubernetesObject]>;
  selectedNode: string | null;
  onNodeClick: (nodeKey: string) => void;
}

// Helper function to determine node health
function getNodeHealth(
  node: KubernetesObject,
): "healthy" | "unhealthy" | "unknown" {
  const conditions = (node.status as NodeStatus)?.conditions || [];

  // Check if Ready condition is True
  const readyCondition = conditions.find((c) => c.type === "Ready");
  if (readyCondition?.status === "True") {
    // Check for any other problematic conditions
    const problemConditions = conditions.filter(
      (c) =>
        c.type !== "Ready" &&
        c.status === "True" &&
        [
          "DiskPressure",
          "MemoryPressure",
          "PIDPressure",
          "NetworkUnavailable",
        ].includes(c.type),
    );
    return problemConditions.length > 0 ? "unhealthy" : "healthy";
  }

  return readyCondition ? "unhealthy" : "unknown";
}

// Helper function to get hardware spec key
function getHardwareSpecKey(node: KubernetesObject): string {
  const capacity = (node.status as NodeStatus)?.capacity || {};
  return `${capacity.cpu || "0"}-${capacity.memory || "0"}`;
}

// Helper function to format hardware spec for display
function formatHardwareSpec(specKey: string): string {
  const [cpu, memory] = specKey.split("-");
  if (cpu === "0" && memory === "0") return "Unknown";

  // Parse memory for display
  const parseMemory = (mem: string) => {
    if (mem.endsWith("Ki")) {
      return `${(parseInt(mem.slice(0, -2)) / 1024 / 1024).toFixed(1)}Gi`;
    }
    if (mem.endsWith("Mi")) {
      return `${(parseInt(mem.slice(0, -2)) / 1024).toFixed(1)}Gi`;
    }
    if (mem.endsWith("Gi")) {
      return mem;
    }
    return mem;
  };

  return `${cpu} CPU, ${parseMemory(memory)}`;
}

// Color scheme for different hardware specs
const hardwareColors = [
  "border-blue-500 bg-blue-50",
  "border-green-500 bg-green-50",
  "border-purple-500 bg-purple-50",
  "border-orange-500 bg-orange-50",
  "border-pink-500 bg-pink-50",
  "border-indigo-500 bg-indigo-50",
];

export function WaffleChart({
  nodes,
  selectedNode,
  onNodeClick,
}: WaffleChartProps) {
  // Group nodes by hardware specs
  const nodeGroups = nodes.reduce(
    (groups, [key, node]) => {
      const specKey = getHardwareSpecKey(node);
      if (!groups[specKey]) {
        groups[specKey] = [];
      }
      groups[specKey].push([key, node]);
      return groups;
    },
    {} as Record<string, Array<[string, KubernetesObject]>>,
  );

  // Calculate grid size based on total number of nodes
  const totalNodes = nodes.length;
  const cols = Math.ceil(Math.sqrt(totalNodes * 1.5)); // Slightly rectangular
  const rows = Math.ceil(totalNodes / cols);

  // Create flat array with group information for rendering
  const flatNodes: Array<{
    key: string;
    node: KubernetesObject;
    specKey: string;
    colorClass: string;
  }> = [];

  Object.entries(nodeGroups).forEach(([specKey, groupNodes], groupIndex) => {
    const colorClass = hardwareColors[groupIndex % hardwareColors.length];
    groupNodes.forEach(([key, node]) => {
      flatNodes.push({ key, node, specKey, colorClass });
    });
  });

  // Health statistics
  const healthStats = flatNodes.reduce(
    (acc, { node }) => {
      const health = getNodeHealth(node);
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Node Health Overview</h2>
          <p className="text-sm text-muted-foreground">
            Click on any node to view detailed information
          </p>
        </div>

        {/* Health Statistics */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm">Healthy: {healthStats.healthy || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm">
              Unhealthy: {healthStats.unhealthy || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-sm">Unknown: {healthStats.unknown || 0}</span>
          </div>
        </div>
      </div>

      {/* Hardware Spec Legend */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Hardware Specifications</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(nodeGroups).map(([specKey, groupNodes], index) => {
            const colorClass = hardwareColors[index % hardwareColors.length];
            return (
              <div
                key={specKey}
                className={cn("px-3 py-1 rounded border text-xs", colorClass)}
              >
                {formatHardwareSpec(specKey)} ({groupNodes.length} nodes)
              </div>
            );
          })}
        </div>
      </div>

      {/* Waffle Chart Grid */}
      <div
        className="grid gap-1 max-w-4xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {flatNodes.map(({ key, node, specKey, colorClass }) => {
          const health = getNodeHealth(node);
          const isSelected = selectedNode === key;

          let healthColor = "";
          switch (health) {
            case "healthy":
              healthColor = "bg-green-500 hover:bg-green-600";
              break;
            case "unhealthy":
              healthColor = "bg-red-500 hover:bg-red-600";
              break;
            default:
              healthColor = "bg-gray-400 hover:bg-gray-500";
          }

          return (
            <button
              key={key}
              onClick={() => onNodeClick(key)}
              className={cn(
                "aspect-square rounded transition-all duration-200 relative group border-2",
                healthColor,
                colorClass.split(" ")[0], // Use only border color from colorClass
                isSelected
                  ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                  : "hover:scale-105",
              )}
              title={`${node.metadata.name} - ${formatHardwareSpec(specKey)} - ${health}`}
            >
              {/* Hardware spec indicator */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-2 h-2 rounded-bl",
                  colorClass.split(" ")[1], // Use only background color from colorClass
                )}
              />

              {/* Node name on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {node.metadata.name}
              </div>
            </button>
          );
        })}

        {/* Fill remaining grid cells if needed */}
        {Array.from({ length: cols * rows - flatNodes.length }, (_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected:{" "}
            <span className="font-medium">
              {
                flatNodes.find((n) => n.key === selectedNode)?.node.metadata
                  .name
              }
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

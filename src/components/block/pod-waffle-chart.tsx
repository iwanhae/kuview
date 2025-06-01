import { cn } from "@/lib/utils";
import type { KubernetesObject } from "@/lib/kuview";

interface PodStatus {
  phase?: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
  }>;
}

interface PodWaffleChartProps {
  pods: Array<[string, KubernetesObject]>;
  selectedPod: string | null;
  onPodClick: (podKey: string) => void;
}

// Helper function to determine pod health
function getPodHealth(
  pod: KubernetesObject,
): "healthy" | "unhealthy" | "pending" | "unknown" {
  const status = (pod.status as PodStatus)?.phase;

  switch (status) {
    case "Running": {
      // Check if all containers are ready
      const conditions = (pod.status as PodStatus)?.conditions || [];
      const readyCondition = conditions.find((c) => c.type === "Ready");
      return readyCondition?.status === "True" ? "healthy" : "unhealthy";
    }
    case "Pending":
      return "pending";
    case "Failed":
    case "CrashLoopBackOff":
      return "unhealthy";
    case "Succeeded":
      return "healthy";
    default:
      return "unknown";
  }
}

// Helper function to get namespace
function getPodNamespace(pod: KubernetesObject): string {
  return pod.metadata?.namespace || "default";
}

// Color scheme for different namespaces
const namespaceColors = [
  "border-blue-500 bg-blue-50",
  "border-green-500 bg-green-50",
  "border-purple-500 bg-purple-50",
  "border-orange-500 bg-orange-50",
  "border-pink-500 bg-pink-50",
  "border-indigo-500 bg-indigo-50",
  "border-yellow-500 bg-yellow-50",
  "border-red-500 bg-red-50",
  "border-teal-500 bg-teal-50",
  "border-cyan-500 bg-cyan-50",
];

export function PodWaffleChart({
  pods,
  selectedPod,
  onPodClick,
}: PodWaffleChartProps) {
  // Group pods by namespace
  const podGroups = pods.reduce(
    (groups, [key, pod]) => {
      const namespace = getPodNamespace(pod);
      if (!groups[namespace]) {
        groups[namespace] = [];
      }
      groups[namespace].push([key, pod]);
      return groups;
    },
    {} as Record<string, Array<[string, KubernetesObject]>>,
  );

  // Calculate grid size based on total number of pods
  const totalPods = pods.length;
  const cols = Math.ceil(Math.sqrt(totalPods * 1.2)); // Slightly more rectangular for pods
  const rows = Math.ceil(totalPods / cols);

  // Create flat array with namespace information for rendering
  const flatPods: Array<{
    key: string;
    pod: KubernetesObject;
    namespace: string;
    colorClass: string;
  }> = [];

  Object.entries(podGroups).forEach(([namespace, groupPods], groupIndex) => {
    const colorClass = namespaceColors[groupIndex % namespaceColors.length];
    groupPods.forEach(([key, pod]) => {
      flatPods.push({ key, pod, namespace, colorClass });
    });
  });

  // Health statistics
  const healthStats = flatPods.reduce(
    (acc, { pod }) => {
      const health = getPodHealth(pod);
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Namespace statistics
  const namespaceStats = Object.entries(podGroups).map(
    ([namespace, groupPods]) => ({
      namespace,
      count: groupPods.length,
      colorClass:
        namespaceColors[
          Object.keys(podGroups).indexOf(namespace) % namespaceColors.length
        ],
    }),
  );

  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Pod Health Overview</h2>
          <p className="text-sm text-muted-foreground">
            Click on any pod to view detailed information
          </p>
        </div>

        {/* Health Statistics */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm">Healthy: {healthStats.healthy || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm">Pending: {healthStats.pending || 0}</span>
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

      {/* Namespace Legend */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Namespaces</h3>
        <div className="flex flex-wrap gap-2">
          {namespaceStats.map(({ namespace, count, colorClass }) => (
            <div
              key={namespace}
              className={cn("px-3 py-1 rounded border text-xs", colorClass)}
            >
              {namespace} ({count} pods)
            </div>
          ))}
        </div>
      </div>

      {/* Waffle Chart Grid */}
      <div
        className="grid gap-1 max-w-5xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {flatPods.map(({ key, pod, namespace, colorClass }) => {
          const health = getPodHealth(pod);
          const isSelected = selectedPod === key;

          let healthColor = "";
          switch (health) {
            case "healthy":
              healthColor = "bg-green-500 hover:bg-green-600";
              break;
            case "pending":
              healthColor = "bg-yellow-500 hover:bg-yellow-600";
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
              onClick={() => onPodClick(key)}
              className={cn(
                "aspect-square rounded transition-all duration-200 relative group border-2",
                healthColor,
                colorClass.split(" ")[0], // Use only border color from colorClass
                isSelected
                  ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                  : "hover:scale-105",
              )}
              title={`${pod.metadata.name} - ${namespace} - ${health}`}
            >
              {/* Namespace indicator */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-2 h-2 rounded-bl",
                  colorClass.split(" ")[1], // Use only background color from colorClass
                )}
              />

              {/* Pod name on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {pod.metadata.name}
              </div>
            </button>
          );
        })}

        {/* Fill remaining grid cells if needed */}
        {Array.from({ length: cols * rows - flatPods.length }, (_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
      </div>

      {/* Selected Pod Info */}
      {selectedPod && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected:{" "}
            <span className="font-medium">
              {flatPods.find((p) => p.key === selectedPod)?.pod.metadata.name}
            </span>
            {" in "}
            <span className="font-medium">
              {flatPods.find((p) => p.key === selectedPod)?.namespace}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

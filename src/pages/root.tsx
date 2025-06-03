import CardResourceOverview from "@/components/block/card-resource-overview";
import { useKuview } from "@/hooks/useKuview";
import type { Status } from "@/lib/status";
import { nodeStatus, podStatus } from "@/lib/status";

export default function Root() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");
  const namespaces = useKuview("v1/Namespace");
  const services = useKuview("v1/Service");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Resource Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nodes */}
        <CardResourceOverview
          resourceName="Nodes"
          status={Object.values(nodes).reduce(
            (acc, node) => {
              const status = nodeStatus(node);
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<Status, number>,
          )}
        />
        {/* Pods */}
        <CardResourceOverview
          resourceName="Pods"
          status={Object.values(pods).reduce(
            (acc, pod) => {
              const status = podStatus(pod);
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<Status, number>,
          )}
        />
      </div>
    </div>
  );
}

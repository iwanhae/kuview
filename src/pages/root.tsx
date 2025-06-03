import CardResourceOverview from "@/components/block/card-resource-overview";
import { useKuview } from "@/hooks/useKuview";
import { PREFIX } from "@/lib/const";
import type { Status } from "@/lib/status";
import { namespaceStatus, nodeStatus, podStatus } from "@/lib/status";

export default function Root() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");
  const namespaces = useKuview("v1/Namespace");
  // const services = useKuview("v1/Service");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Resource Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nodes */}
        <CardResourceOverview
          href={`${PREFIX}/nodes`}
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
        {/* Namespaces */}
        <CardResourceOverview
          href={`${PREFIX}/namespaces`}
          resourceName="Namespaces"
          status={Object.values(namespaces).reduce(
            (acc, namespace) => {
              const status = namespaceStatus(namespace);
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<Status, number>,
          )}
        />
        {/* Pods */}
        <CardResourceOverview
          href={`${PREFIX}/pods`}
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

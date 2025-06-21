import CardResourceOverview from "@/components/block/card-resource-overview";
import ClusterResourceOverview from "@/components/block/cluster-resource-overview";
import NodesResourceTable from "@/components/block/nodes-resource-table";
import { useKuview } from "@/hooks/useKuview";
import { PREFIX } from "@/lib/const";
import type { Status } from "@/lib/status";
import { getStatus } from "@/lib/status";

export default function Root() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");
  const namespaces = useKuview("v1/Namespace");
  const services = useKuview("v1/Service");
  const userGroup = useKuview("kuview.iwanhae.kr/v1/UserGroup");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Cluster Resource Overview */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClusterResourceOverview />
        <NodesResourceTable />
      </div>
      {/* Resource Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nodes */}
        <CardResourceOverview
          href={`${PREFIX}/nodes`}
          resourceName="Nodes"
          status={Object.values(nodes).reduce(
            (acc, node) => {
              const status = getStatus(node).status;
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
              const status = getStatus(namespace).status;
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
              const status = getStatus(pod).status;
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<Status, number>,
          )}
        />
        {/* Services */}
        <CardResourceOverview
          href={`${PREFIX}/services`}
          resourceName="Services"
          status={Object.values(services).reduce(
            (acc, service) => {
              const status = getStatus(service).status;
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<Status, number>,
          )}
        />

        {/* Users */}
        <CardResourceOverview
          href={`${PREFIX}/usergroups`}
          resourceName="UserGroups"
          status={Object.values(userGroup).reduce(
            (acc, userGroup) => {
              const status = getStatus(userGroup).status;
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

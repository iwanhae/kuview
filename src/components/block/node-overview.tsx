import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceBar from "./resource-bar";
import NodePodsGrid from "./node-pods-grid";

interface NodeOverviewProps {
  node: NodeObject;
}

interface ResourceUsage {
  cpu: {
    capacity: number; // millicores
    requests: number; // millicores
    limits: number; // millicores
  };
  memory: {
    capacity: number; // bytes
    requests: number; // bytes
    limits: number; // bytes
  };
}

function calculateResourceUsage(
  node: NodeObject,
  nodePods: PodObject[],
): ResourceUsage {
  const capacity = node.status.capacity || {};
  const cpuCapacity = parseCpu(capacity.cpu || "0");
  const memoryCapacity = parseMemory(capacity.memory || "0");

  let cpuRequests = 0;
  let cpuLimits = 0;
  let memoryRequests = 0;
  let memoryLimits = 0;

  nodePods.forEach((pod) => {
    pod.spec.containers.forEach((container) => {
      const resources = container.resources || {};

      if (resources.requests) {
        cpuRequests += parseCpu(resources.requests.cpu || "0");
        memoryRequests += parseMemory(resources.requests.memory || "0");
      }

      if (resources.limits) {
        cpuLimits += parseCpu(resources.limits.cpu || "0");
        memoryLimits += parseMemory(resources.limits.memory || "0");
      }
    });
  });

  return {
    cpu: {
      capacity: cpuCapacity,
      requests: cpuRequests,
      limits: cpuLimits,
    },
    memory: {
      capacity: memoryCapacity,
      requests: memoryRequests,
      limits: memoryLimits,
    },
  };
}

export default function NodeOverview({ node }: NodeOverviewProps) {
  const podsData = useKuview("v1/Pod");

  // Filter pods that belong to the selected node
  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  const resourceUsage = calculateResourceUsage(node, nodePods);

  return (
    <div className="space-y-4">
      {/* Pods */}
      <NodePodsGrid pods={nodePods} />

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResourceBar
            title="CPU"
            requests={resourceUsage.cpu.requests}
            limits={resourceUsage.cpu.limits}
            capacity={resourceUsage.cpu.capacity}
            formatValue={formatCpu}
          />
          <ResourceBar
            title="Memory"
            requests={resourceUsage.memory.requests}
            limits={resourceUsage.memory.limits}
            capacity={resourceUsage.memory.capacity}
            formatValue={formatBytes}
          />
        </CardContent>
      </Card>
    </div>
  );
}

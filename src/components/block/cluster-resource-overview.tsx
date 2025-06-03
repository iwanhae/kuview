import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClusterResourceBar from "./cluster-resource-bar";

interface ClusterResourceUsage {
  cpu: {
    totalCapacity: number;
    totalRequests: number;
    totalLimits: number;
    nodeCount: number;
  };
  memory: {
    totalCapacity: number;
    totalRequests: number;
    totalLimits: number;
    nodeCount: number;
  };
}

function calculateClusterResourceUsage(
  nodes: Record<string, NodeObject>,
  pods: Record<string, PodObject>,
): ClusterResourceUsage {
  const nodeList = Object.values(nodes);
  const podList = Object.values(pods);

  let totalCpuCapacity = 0;
  let totalMemoryCapacity = 0;
  let totalCpuRequests = 0;
  let totalCpuLimits = 0;
  let totalMemoryRequests = 0;
  let totalMemoryLimits = 0;

  // Calculate total capacity from all nodes
  nodeList.forEach((node) => {
    const capacity = node.status.capacity || {};
    totalCpuCapacity += parseCpu(capacity.cpu || "0");
    totalMemoryCapacity += parseMemory(capacity.memory || "0");
  });

  // Calculate total requests and limits from all pods
  podList.forEach((pod) => {
    pod.spec.containers.forEach((container) => {
      const resources = container.resources || {};

      if (resources.requests) {
        totalCpuRequests += parseCpu(resources.requests.cpu || "0");
        totalMemoryRequests += parseMemory(resources.requests.memory || "0");
      }

      if (resources.limits) {
        totalCpuLimits += parseCpu(resources.limits.cpu || "0");
        totalMemoryLimits += parseMemory(resources.limits.memory || "0");
      }
    });
  });

  return {
    cpu: {
      totalCapacity: totalCpuCapacity,
      totalRequests: totalCpuRequests,
      totalLimits: totalCpuLimits,
      nodeCount: nodeList.length,
    },
    memory: {
      totalCapacity: totalMemoryCapacity,
      totalRequests: totalMemoryRequests,
      totalLimits: totalMemoryLimits,
      nodeCount: nodeList.length,
    },
  };
}

export default function ClusterResourceOverview() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");

  const clusterUsage = calculateClusterResourceUsage(nodes, pods);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cluster Resource Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ClusterResourceBar
          title="CPU"
          requests={clusterUsage.cpu.totalRequests}
          limits={clusterUsage.cpu.totalLimits}
          capacity={clusterUsage.cpu.totalCapacity}
          formatValue={formatCpu}
          nodeCount={clusterUsage.cpu.nodeCount}
        />
        <ClusterResourceBar
          title="Memory"
          requests={clusterUsage.memory.totalRequests}
          limits={clusterUsage.memory.totalLimits}
          capacity={clusterUsage.memory.totalCapacity}
          formatValue={formatBytes}
          nodeCount={clusterUsage.memory.nodeCount}
        />
      </CardContent>
    </Card>
  );
}

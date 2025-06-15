import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject, PodMetricsObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import { ResourceRadialChart } from "./resource-radial-chart";
import type { ResourceData } from "./pod-resource-usage";
import { useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface ClusterResourceUsage {
  cpu: {
    totalCapacity: number;
    totalRequests: number;
    totalLimits: number;
    totalUsage?: number;
    nodeCount: number;
  };
  memory: {
    totalCapacity: number;
    totalRequests: number;
    totalLimits: number;
    totalUsage?: number;
    nodeCount: number;
  };
}

function calculateClusterResourceUsage(
  nodes: Record<string, NodeObject>,
  pods: Record<string, PodObject>,
  podMetrics: Record<string, PodMetricsObject>,
): ClusterResourceUsage {
  const nodeList = Object.values(nodes);
  const podList = Object.values(pods);
  const podMetricsList = Object.values(podMetrics);

  let totalCpuCapacity = 0;
  let totalMemoryCapacity = 0;
  let totalCpuRequests = 0;
  let totalCpuLimits = 0;
  let totalMemoryRequests = 0;
  let totalMemoryLimits = 0;
  let totalCpuUsage = 0;
  let totalMemoryUsage = 0;

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

  // Calculate total usage from all pod metrics
  podMetricsList.forEach((podMetric) => {
    podMetric.containers.forEach((containerMetrics) => {
      totalCpuUsage += parseCpu(containerMetrics.usage.cpu || "0");
      totalMemoryUsage += parseMemory(containerMetrics.usage.memory || "0");
    });
  });

  return {
    cpu: {
      totalCapacity: totalCpuCapacity,
      totalRequests: totalCpuRequests,
      totalLimits: totalCpuLimits,
      totalUsage: podMetricsList.length > 0 ? totalCpuUsage : undefined,
      nodeCount: nodeList.length,
    },
    memory: {
      totalCapacity: totalMemoryCapacity,
      totalRequests: totalMemoryRequests,
      totalLimits: totalMemoryLimits,
      totalUsage: podMetricsList.length > 0 ? totalMemoryUsage : undefined,
      nodeCount: nodeList.length,
    },
  };
}

const cpuChartConfig = {
  percentage: {
    label: "Percentage",
  },
  requests: {
    label: "Requests",
    color: "#93c5fd",
  },
  limits: {
    label: "Limits",
    color: "#60a5fa",
  },
  actual: {
    label: "Usage",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const memoryChartConfig = {
  percentage: {
    label: "Percentage",
  },
  requests: {
    label: "Requests",
    color: "#a7f3d0",
  },
  limits: {
    label: "Limits",
    color: "#6ee7b7",
  },
  actual: {
    label: "Usage",
    color: "#34d399",
  },
} satisfies ChartConfig;

export default function ClusterResourceOverview() {
  const rawNodes = useKuview("v1/Node");
  const rawPods = useKuview("v1/Pod");
  const rawPodMetrics = useKuview("metrics.k8s.io/v1beta1/PodMetrics");

  const [dataForCalculation, setDataForCalculation] = useState({
    nodes: rawNodes,
    pods: rawPods,
    podMetrics: rawPodMetrics,
  });

  useEffect(() => {
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      podMetrics: rawPodMetrics,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      podMetrics: rawPodMetrics,
    });
  };

  const clusterUsage = useMemo(() => {
    console.log(
      "[REACT] Recalculating clusterUsage due to dataForCalculation update",
      new Date().toLocaleTimeString(),
    );
    return calculateClusterResourceUsage(
      dataForCalculation.nodes,
      dataForCalculation.pods,
      dataForCalculation.podMetrics,
    );
  }, [dataForCalculation]);

  // Prepare CPU chart data
  const cpuData: ResourceData[] = [];

  if (clusterUsage.cpu.totalRequests > 0) {
    cpuData.push({
      type: "requests",
      value: clusterUsage.cpu.totalRequests,
      percentage:
        clusterUsage.cpu.totalCapacity > 0
          ? (clusterUsage.cpu.totalRequests / clusterUsage.cpu.totalCapacity) *
            100
          : 0,
      fill: cpuChartConfig.requests.color,
    });
  }

  if (clusterUsage.cpu.totalLimits > 0) {
    cpuData.push({
      type: "limits",
      value: clusterUsage.cpu.totalLimits,
      percentage:
        clusterUsage.cpu.totalCapacity > 0
          ? (clusterUsage.cpu.totalLimits / clusterUsage.cpu.totalCapacity) *
            100
          : 0,
      fill: cpuChartConfig.limits.color,
    });
  }

  if (
    clusterUsage.cpu.totalUsage !== undefined &&
    clusterUsage.cpu.totalUsage > 0
  ) {
    cpuData.push({
      type: "actual",
      value: clusterUsage.cpu.totalUsage,
      percentage:
        clusterUsage.cpu.totalCapacity > 0
          ? (clusterUsage.cpu.totalUsage / clusterUsage.cpu.totalCapacity) * 100
          : 0,
      fill: cpuChartConfig.actual.color,
    });
  }

  // Prepare Memory chart data
  const memoryData: ResourceData[] = [];

  if (clusterUsage.memory.totalRequests > 0) {
    memoryData.push({
      type: "requests",
      value: clusterUsage.memory.totalRequests,
      percentage:
        clusterUsage.memory.totalCapacity > 0
          ? (clusterUsage.memory.totalRequests /
              clusterUsage.memory.totalCapacity) *
            100
          : 0,
      fill: memoryChartConfig.requests.color,
    });
  }

  if (clusterUsage.memory.totalLimits > 0) {
    memoryData.push({
      type: "limits",
      value: clusterUsage.memory.totalLimits,
      percentage:
        clusterUsage.memory.totalCapacity > 0
          ? (clusterUsage.memory.totalLimits /
              clusterUsage.memory.totalCapacity) *
            100
          : 0,
      fill: memoryChartConfig.limits.color,
    });
  }

  if (
    clusterUsage.memory.totalUsage !== undefined &&
    clusterUsage.memory.totalUsage > 0
  ) {
    memoryData.push({
      type: "actual",
      value: clusterUsage.memory.totalUsage,
      percentage:
        clusterUsage.memory.totalCapacity > 0
          ? (clusterUsage.memory.totalUsage /
              clusterUsage.memory.totalCapacity) *
            100
          : 0,
      fill: memoryChartConfig.actual.color,
    });
  }

  if (cpuData.length === 0 && memoryData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cluster Resource Overview</CardTitle>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>No resource usage data available to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cluster Resource Overview</h2>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {cpuData.length > 0 && (
          <ResourceRadialChart
            title="CPU"
            capacity={clusterUsage.cpu.totalCapacity}
            data={cpuData}
            chartConfig={cpuChartConfig}
            formatValue={formatCpu}
          />
        )}
        {memoryData.length > 0 && (
          <ResourceRadialChart
            title="Memory"
            capacity={clusterUsage.memory.totalCapacity}
            data={memoryData}
            chartConfig={memoryChartConfig}
            formatValue={formatBytes}
          />
        )}
      </div>
    </div>
  );
}

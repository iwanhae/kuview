"use client";

import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject, NodeMetricsObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceRadialChart } from "./resource-radial-chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ResourceData } from "./pod-resource-usage";

interface NodeResourceUsageProps {
  node: NodeObject;
}

interface ResourceUsage {
  cpu: {
    capacity: number;
    requests: number;
    limits: number;
    usage?: number;
  };
  memory: {
    capacity: number;
    requests: number;
    limits: number;
    usage?: number;
  };
}

function calculateResourceUsage(
  node: NodeObject,
  nodePods: PodObject[],
  nodeMetrics?: NodeMetricsObject,
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

  let cpuUsage: number | undefined;
  let memoryUsage: number | undefined;

  if (nodeMetrics) {
    cpuUsage = parseCpu(nodeMetrics.usage.cpu || "0");
    memoryUsage = parseMemory(nodeMetrics.usage.memory || "0");
  }

  return {
    cpu: {
      capacity: cpuCapacity,
      requests: cpuRequests,
      limits: cpuLimits,
      usage: cpuUsage,
    },
    memory: {
      capacity: memoryCapacity,
      requests: memoryRequests,
      limits: memoryLimits,
      usage: memoryUsage,
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
  usage: {
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
  usage: {
    label: "Usage",
    color: "#34d399",
  },
} satisfies ChartConfig;

export default function NodeResourceUsage({ node }: NodeResourceUsageProps) {
  const podsData = useKuview("v1/Pod");
  const nodeMetricsData = useKuview("metrics.k8s.io/v1beta1/NodeMetrics");

  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  const nodeMetrics = Object.values(nodeMetricsData).find(
    (metrics) => metrics.metadata.name === node.metadata.name,
  );

  const resourceUsage = calculateResourceUsage(node, nodePods, nodeMetrics);

  const cpuData: ResourceData[] = [
    {
      type: "requests",
      value: resourceUsage.cpu.requests,
      percentage:
        (resourceUsage.cpu.requests / resourceUsage.cpu.capacity) * 100,
      fill: cpuChartConfig.requests.color,
    },
    {
      type: "limits",
      value: resourceUsage.cpu.limits,
      percentage: (resourceUsage.cpu.limits / resourceUsage.cpu.capacity) * 100,
      fill: cpuChartConfig.limits.color,
    },
  ];

  if (resourceUsage.cpu.usage !== undefined) {
    cpuData.push({
      type: "usage",
      value: resourceUsage.cpu.usage,
      percentage: (resourceUsage.cpu.usage / resourceUsage.cpu.capacity) * 100,
      fill: cpuChartConfig.usage.color,
    });
  }

  const memoryData: ResourceData[] = [
    {
      type: "requests",
      value: resourceUsage.memory.requests,
      percentage:
        (resourceUsage.memory.requests / resourceUsage.memory.capacity) * 100,
      fill: memoryChartConfig.requests.color,
    },
    {
      type: "limits",
      value: resourceUsage.memory.limits,
      percentage:
        (resourceUsage.memory.limits / resourceUsage.memory.capacity) * 100,
      fill: memoryChartConfig.limits.color,
    },
  ];

  if (resourceUsage.memory.usage !== undefined) {
    memoryData.push({
      type: "usage",
      value: resourceUsage.memory.usage,
      percentage:
        (resourceUsage.memory.usage / resourceUsage.memory.capacity) * 100,
      fill: memoryChartConfig.usage.color,
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourceRadialChart
          title="CPU"
          capacity={resourceUsage.cpu.capacity}
          data={cpuData}
          chartConfig={cpuChartConfig}
          formatValue={formatCpu}
        />
        <ResourceRadialChart
          title="Memory"
          capacity={resourceUsage.memory.capacity}
          data={memoryData}
          chartConfig={memoryChartConfig}
          formatValue={formatBytes}
        />
      </CardContent>
    </Card>
  );
}

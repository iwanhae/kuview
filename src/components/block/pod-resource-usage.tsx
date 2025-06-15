"use client";

import type { PodObject, PodMetricsObject } from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ResourceRadialChart } from "./resource-radial-chart";

interface PodResourceUsageProps {
  pod: PodObject;
}

export interface ResourceData {
  type: string;
  value: number;
  percentage: number;
  fill: string;
}

interface PodResourceUsage {
  cpu: {
    requests: number;
    limits: number;
    usage?: number;
  };
  memory: {
    requests: number;
    limits: number;
    usage?: number;
  };
}

function calculatePodResourceUsage(
  pod: PodObject,
  podMetrics?: PodMetricsObject,
): PodResourceUsage {
  let cpuRequests = 0;
  let cpuLimits = 0;
  let memoryRequests = 0;
  let memoryLimits = 0;

  // Calculate requests and limits from pod spec
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

  // Calculate actual usage from metrics
  let cpuUsage: number | undefined;
  let memoryUsage: number | undefined;

  if (podMetrics) {
    cpuUsage = 0;
    memoryUsage = 0;

    podMetrics.containers.forEach((containerMetrics) => {
      cpuUsage! += parseCpu(containerMetrics.usage.cpu || "0");
      memoryUsage! += parseMemory(containerMetrics.usage.memory || "0");
    });
  }

  return {
    cpu: {
      requests: cpuRequests,
      limits: cpuLimits,
      usage: cpuUsage,
    },
    memory: {
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

export default function PodResourceUsage({ pod }: PodResourceUsageProps) {
  const podMetricsData = useKuview("metrics.k8s.io/v1beta1/PodMetrics");
  const nodesData = useKuview("v1/Node");

  // Find metrics for the current pod
  const podMetrics =
    podMetricsData[`${pod.metadata.namespace}/${pod.metadata.name}`];

  // Find the node this pod is running on
  const node = Object.values(nodesData).find(
    (n) => n.metadata.name === pod.spec.nodeName,
  );

  if (!node) {
    return null;
  }

  const resourceUsage = calculatePodResourceUsage(pod, podMetrics);

  // Get node capacity
  const nodeCapacity = node.status.capacity || {};
  const nodeCpuCapacity = parseCpu(nodeCapacity.cpu || "0");
  const nodeMemoryCapacity = parseMemory(nodeCapacity.memory || "0");

  // Prepare CPU chart data
  const cpuData: ResourceData[] = [];

  if (resourceUsage.cpu.requests > 0) {
    cpuData.push({
      type: "requests",
      value: resourceUsage.cpu.requests,
      percentage:
        nodeCpuCapacity > 0
          ? (resourceUsage.cpu.requests / nodeCpuCapacity) * 100
          : 0,
      fill: cpuChartConfig.requests.color,
    });
  }

  if (resourceUsage.cpu.limits > 0) {
    cpuData.push({
      type: "limits",
      value: resourceUsage.cpu.limits,
      percentage:
        nodeCpuCapacity > 0
          ? (resourceUsage.cpu.limits / nodeCpuCapacity) * 100
          : 0,
      fill: cpuChartConfig.limits.color,
    });
  }

  if (resourceUsage.cpu.usage !== undefined && resourceUsage.cpu.usage > 0) {
    cpuData.push({
      type: "actual",
      value: resourceUsage.cpu.usage,
      percentage:
        nodeCpuCapacity > 0
          ? (resourceUsage.cpu.usage / nodeCpuCapacity) * 100
          : 0,
      fill: cpuChartConfig.actual.color,
    });
  }

  // Prepare Memory chart data
  const memoryData: ResourceData[] = [];

  if (resourceUsage.memory.requests > 0) {
    memoryData.push({
      type: "requests",
      value: resourceUsage.memory.requests,
      percentage:
        nodeMemoryCapacity > 0
          ? (resourceUsage.memory.requests / nodeMemoryCapacity) * 100
          : 0,
      fill: memoryChartConfig.requests.color,
    });
  }

  if (resourceUsage.memory.limits > 0) {
    memoryData.push({
      type: "limits",
      value: resourceUsage.memory.limits,
      percentage:
        nodeMemoryCapacity > 0
          ? (resourceUsage.memory.limits / nodeMemoryCapacity) * 100
          : 0,
      fill: memoryChartConfig.limits.color,
    });
  }

  if (
    resourceUsage.memory.usage !== undefined &&
    resourceUsage.memory.usage > 0
  ) {
    memoryData.push({
      type: "actual",
      value: resourceUsage.memory.usage,
      percentage:
        nodeMemoryCapacity > 0
          ? (resourceUsage.memory.usage / nodeMemoryCapacity) * 100
          : 0,
      fill: memoryChartConfig.actual.color,
    });
  }

  if (cpuData.length === 0 && memoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage vs Node Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No resource usage data available to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {cpuData.length > 0 && (
        <ResourceRadialChart
          title="CPU"
          nodeCapacity={nodeCpuCapacity}
          data={cpuData}
          chartConfig={cpuChartConfig}
          formatValue={formatCpu}
        />
      )}
      {memoryData.length > 0 && (
        <ResourceRadialChart
          title="Memory"
          nodeCapacity={nodeMemoryCapacity}
          data={memoryData}
          chartConfig={memoryChartConfig}
          formatValue={formatBytes}
        />
      )}
    </div>
  );
}

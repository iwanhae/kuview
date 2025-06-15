"use client";

import type { PodObject, PodMetricsObject } from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";
import {
  parseCpu,
  parseMemory,
  formatCpu,
  formatBytes,
  generateChartData,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceRadialChart } from "./resource-radial-chart";
import { cpuChartConfig, memoryChartConfig } from "@/config/charts";

interface PodResourceUsageProps {
  pod: PodObject;
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

  const cpuData = generateChartData(
    nodeCpuCapacity,
    resourceUsage.cpu,
    cpuChartConfig,
  );

  const memoryData = generateChartData(
    nodeMemoryCapacity,
    resourceUsage.memory,
    memoryChartConfig,
  );

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
          capacity={nodeCpuCapacity}
          data={cpuData}
          chartConfig={cpuChartConfig}
          formatValue={formatCpu}
        />
      )}
      {memoryData.length > 0 && (
        <ResourceRadialChart
          title="Memory"
          capacity={nodeMemoryCapacity}
          data={memoryData}
          chartConfig={memoryChartConfig}
          formatValue={formatBytes}
        />
      )}
    </div>
  );
}

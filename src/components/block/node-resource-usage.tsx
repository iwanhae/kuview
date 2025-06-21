"use client";

import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject, NodeMetricsObject } from "@/lib/kuview";
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

  nodePods
    .filter((pod) => pod.kuviewExtra?.status === "Running")
    .forEach((pod) => {
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

export default function NodeResourceUsage({ node }: NodeResourceUsageProps) {
  const podsData = useKuview("v1/Pod");
  const nodeMetricsData = useKuview("metrics.k8s.io/v1beta1/NodeMetrics");

  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  const nodeMetrics = nodeMetricsData[node.metadata.name];

  const resourceUsage = calculateResourceUsage(node, nodePods, nodeMetrics);

  const cpuData = generateChartData(
    resourceUsage.cpu.capacity,
    resourceUsage.cpu,
    cpuChartConfig,
  );

  const memoryData = generateChartData(
    resourceUsage.memory.capacity,
    resourceUsage.memory,
    memoryChartConfig,
  );
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

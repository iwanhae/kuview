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
import { Button } from "@/components/ui/button";
import { ResourceRadialChart } from "./resource-radial-chart";
import { useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { cpuChartConfig, memoryChartConfig } from "@/config/charts";

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
  nodeMetrics: Record<string, NodeMetricsObject>,
): ClusterResourceUsage {
  const nodeList = Object.values(nodes);
  const podList = Object.values(pods);

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

    const metrics = nodeMetrics[node.metadata.name];
    if (metrics) {
      totalCpuUsage += parseCpu(metrics.usage.cpu || "0");
      totalMemoryUsage += parseMemory(metrics.usage.memory || "0");
    }
  });

  // Calculate total requests and limits from all pods
  podList
    .filter((pod) => pod.kuviewExtra?.status === "Running")
    .forEach((pod) => {
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
      totalUsage: totalCpuUsage,
      nodeCount: nodeList.length,
    },
    memory: {
      totalCapacity: totalMemoryCapacity,
      totalRequests: totalMemoryRequests,
      totalLimits: totalMemoryLimits,
      totalUsage: totalMemoryUsage,
      nodeCount: nodeList.length,
    },
  };
}

export default function ClusterResourceOverview() {
  const rawNodes = useKuview("v1/Node");
  const rawPods = useKuview("v1/Pod");
  const rawNodeMetrics = useKuview("metrics.k8s.io/v1beta1/NodeMetrics");
  // Passive mode is used to prevent the chart from recalculating when the data is too big to calculate every time.
  const [passiveMode, setPassiveMode] = useState(false);

  const [dataForCalculation, setDataForCalculation] = useState({
    nodes: rawNodes,
    pods: rawPods,
    nodeMetrics: rawNodeMetrics,
  });

  useEffect(() => {
    if (passiveMode) return;
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      nodeMetrics: rawNodeMetrics,
    });
  }, [rawNodes, rawPods, rawNodeMetrics, passiveMode]);

  const handleRefresh = () => {
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      nodeMetrics: rawNodeMetrics,
    });
  };

  const clusterUsage = useMemo(() => {
    const since = dayjs();
    const result = calculateClusterResourceUsage(
      dataForCalculation.nodes,
      dataForCalculation.pods,
      dataForCalculation.nodeMetrics,
    );

    const diff = Math.abs(since.diff());
    // if diff is bigger than 16ms, it means it takes more than 1 frame to calculate.
    if (diff > 16) {
      setPassiveMode(true);
      console.log(
        "[REACT] Passive mode activated due to slow calculation",
        diff,
      );
    }
    return result;
  }, [dataForCalculation]);

  const cpuData = generateChartData(
    clusterUsage.cpu.totalCapacity,
    {
      requests: clusterUsage.cpu.totalRequests,
      limits: clusterUsage.cpu.totalLimits,
      usage: clusterUsage.cpu.totalUsage,
    },
    cpuChartConfig,
  );

  const memoryData = generateChartData(
    clusterUsage.memory.totalCapacity,
    {
      requests: clusterUsage.memory.totalRequests,
      limits: clusterUsage.memory.totalLimits,
      usage: clusterUsage.memory.totalUsage,
    },
    memoryChartConfig,
  );

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
        {passiveMode && (
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
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

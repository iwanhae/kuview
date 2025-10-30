import { useKuview } from "@/hooks/useKuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseCpu, parseMemory, formatBytes, formatCpu } from "@/lib/utils";
import type {
  PodObject,
  PodMetricsObject,
  NodeObject,
  NodeMetricsObject,
} from "@/lib/kuview";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, X } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { getStatus } from "@/lib/status";
import { useLocation } from "wouter";
import { PREFIX } from "@/lib/const";

interface PodResourceData {
  name: string;
  namespace: string;
  cpu: number; // millicores
  memory: number; // bytes
  status: string;
}

interface NodeResourceData {
  name: string;
  cpu: number; // millicores
  memory: number; // bytes
  status: string;
}

function calculatePodResources(
  pods: Record<string, PodObject>,
  podMetrics: Record<string, PodMetricsObject>,
): PodResourceData[] {
  const result: PodResourceData[] = [];

  Object.values(pods).forEach((pod) => {
    const podKey = `${pod.metadata.namespace}/${pod.metadata.name}`;
    const metrics = podMetrics[podKey];

    if (!metrics) {
      return; // Skip pods without metrics
    }

    let cpuUsage = 0;
    let memoryUsage = 0;

    metrics.containers.forEach((container) => {
      cpuUsage += parseCpu(container.usage.cpu || "0");
      memoryUsage += parseMemory(container.usage.memory || "0");
    });

    const status = getStatus(pod).status;

    result.push({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace || "default",
      cpu: cpuUsage,
      memory: memoryUsage,
      status: status || "unknown",
    });
  });

  return result;
}

function calculateNodeResources(
  nodes: Record<string, NodeObject>,
  nodeMetrics: Record<string, NodeMetricsObject>,
): NodeResourceData[] {
  const result: NodeResourceData[] = [];

  Object.values(nodes).forEach((node) => {
    const metrics = nodeMetrics[node.metadata.name];

    if (!metrics) {
      return; // Skip nodes without metrics
    }

    const cpuUsage = parseCpu(metrics.usage.cpu || "0");
    const memoryUsage = parseMemory(metrics.usage.memory || "0");

    // Determine node status from conditions
    let status = "Unknown";
    if (node.status.conditions) {
      const readyCondition = node.status.conditions.find(
        (c) => c.type === "Ready",
      );
      if (readyCondition) {
        status = readyCondition.status === "True" ? "Ready" : "NotReady";
      }
    }

    result.push({
      name: node.metadata.name,
      cpu: cpuUsage,
      memory: memoryUsage,
      status,
    });
  });

  return result;
}

export default function ResourceOverviewPage() {
  const pods = useKuview("v1/Pod");
  const podMetrics = useKuview("metrics.k8s.io/v1beta1/PodMetrics");
  const nodes = useKuview("v1/Node");
  const nodeMetrics = useKuview("metrics.k8s.io/v1beta1/NodeMetrics");
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState("pods");
  const [podResourceData, setPodResourceData] = useState<PodResourceData[]>([]);
  const [nodeResourceData, setNodeResourceData] = useState<NodeResourceData[]>(
    [],
  );
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedCellPods, setSelectedCellPods] = useState<PodResourceData[]>(
    [],
  );
  const [selectedCellNodes, setSelectedCellNodes] = useState<
    NodeResourceData[]
  >([]);
  const [selectedRange, setSelectedRange] = useState<{
    cpuMin: number;
    cpuMax: number;
    memoryMin: number;
    memoryMax: number;
  } | null>(null);

  useEffect(() => {
    if (hasInitialized) {
      return;
    }

    const podData = calculatePodResources(pods, podMetrics);
    const nodeData = calculateNodeResources(nodes, nodeMetrics);
    setPodResourceData(podData);
    setNodeResourceData(nodeData);
    setHasInitialized(true);
    setLastUpdated(new Date().toISOString());
  }, [hasInitialized, pods, podMetrics, nodes, nodeMetrics]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      const podData = calculatePodResources(pods, podMetrics);
      const nodeData = calculateNodeResources(nodes, nodeMetrics);
      setPodResourceData(podData);
      setNodeResourceData(nodeData);
      setLastUpdated(new Date().toISOString());
    } finally {
      setIsRefreshing(false);
    }
  }, [pods, podMetrics, nodes, nodeMetrics]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return new Date(lastUpdated).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  // Calculate Pod statistics
  const podStats = useMemo(() => {
    if (podResourceData.length === 0) {
      return {
        total: 0,
        avgCpu: 0,
        avgMemory: 0,
        maxCpu: 0,
        maxMemory: 0,
      };
    }

    const totalCpu = podResourceData.reduce((sum, pod) => sum + pod.cpu, 0);
    const totalMemory = podResourceData.reduce(
      (sum, pod) => sum + pod.memory,
      0,
    );
    const maxCpu = Math.max(...podResourceData.map((pod) => pod.cpu));
    const maxMemory = Math.max(...podResourceData.map((pod) => pod.memory));

    return {
      total: podResourceData.length,
      avgCpu: totalCpu / podResourceData.length,
      avgMemory: totalMemory / podResourceData.length,
      maxCpu,
      maxMemory,
    };
  }, [podResourceData]);

  // Calculate Node statistics
  const nodeStats = useMemo(() => {
    if (nodeResourceData.length === 0) {
      return {
        total: 0,
        avgCpu: 0,
        avgMemory: 0,
        maxCpu: 0,
        maxMemory: 0,
      };
    }

    const totalCpu = nodeResourceData.reduce((sum, node) => sum + node.cpu, 0);
    const totalMemory = nodeResourceData.reduce(
      (sum, node) => sum + node.memory,
      0,
    );
    const maxCpu = Math.max(...nodeResourceData.map((node) => node.cpu));
    const maxMemory = Math.max(...nodeResourceData.map((node) => node.memory));

    return {
      total: nodeResourceData.length,
      avgCpu: totalCpu / nodeResourceData.length,
      avgMemory: totalMemory / nodeResourceData.length,
      maxCpu,
      maxMemory,
    };
  }, [nodeResourceData]);

  // Aggregate Pod data into buckets for heatmap
  const {
    heatmapData: podHeatmapData,
    chartOptions: podChartOptions,
    minMemory: podMinMemory,
    maxMemory: podMaxMemory,
    minCpu: podMinCpu,
    maxCpu: podMaxCpu,
    memoryStep: podMemoryStep,
    cpuStep: podCpuStep,
    memoryBuckets: podMemoryBuckets,
    cpuBuckets: podCpuBuckets,
  } = useMemo(() => {
    if (podResourceData.length === 0) {
      return {
        heatmapData: [],
        chartOptions: {},
        minMemory: 0,
        maxMemory: 0,
        minCpu: 0,
        maxCpu: 0,
        memoryStep: 0,
        cpuStep: 0,
        memoryBuckets: 0,
        cpuBuckets: 0,
      };
    }

    // Find min/max for bucket ranges (convert to GB)
    const memoryValues = podResourceData.map(
      (p) => p.memory / (1024 * 1024 * 1024),
    );
    const cpuValues = podResourceData.map((p) => p.cpu / 1000);

    const minMemory = Math.min(...memoryValues);
    const maxMemory = Math.max(...memoryValues);
    const minCpu = Math.min(...cpuValues);
    const maxCpu = Math.max(...cpuValues);

    // Create buckets - 20x20 grid for heatmap
    const memoryBuckets = 40;
    const cpuBuckets = 20;
    const memoryStep = (maxMemory - minMemory) / memoryBuckets || 1;
    const cpuStep = (maxCpu - minCpu) / cpuBuckets || 1;

    // Initialize 2D array for counting pods in each bucket
    const bucketCounts: number[][] = Array(cpuBuckets)
      .fill(0)
      .map(() => Array(memoryBuckets).fill(0));

    // Count pods in each bucket
    podResourceData.forEach((pod) => {
      const memoryGB = pod.memory / (1024 * 1024 * 1024);
      const cpuCores = pod.cpu / 1000;

      const memBucket = Math.min(
        Math.floor((memoryGB - minMemory) / memoryStep),
        memoryBuckets - 1,
      );
      const cpuBucket = Math.min(
        Math.floor((cpuCores - minCpu) / cpuStep),
        cpuBuckets - 1,
      );

      bucketCounts[cpuBucket][memBucket]++;
    });

    // Find max count for log scale normalization
    const maxCount = Math.max(...bucketCounts.flat());

    // Convert to heatmap series format with log scale
    const series = bucketCounts.map((row, cpuIdx) => ({
      name: `${(minCpu + cpuIdx * cpuStep).toFixed(2)}-${(minCpu + (cpuIdx + 1) * cpuStep).toFixed(2)} cores`,
      data: row.map((count, memIdx) => ({
        x: `${(minMemory + memIdx * memoryStep).toFixed(1)}-${(minMemory + (memIdx + 1) * memoryStep).toFixed(1)} GB`,
        y: count > 0 ? Math.log10(count + 1) : 0, // Log scale transformation
        originalCount: count, // Keep original count for tooltip
      })),
    }));

    const options: ApexOptions = {
      chart: {
        type: "heatmap",
        toolbar: {
          show: true,
        },
        animations: {
          enabled: false,
        },
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            const cpuIdx = config.seriesIndex;
            const memIdx = config.dataPointIndex;
            // This will be called later via ref
            const globalWindow = window as typeof window & {
              handleHeatmapClick?: (cpuIdx: number, memIdx: number) => void;
            };
            if (globalWindow.handleHeatmapClick) {
              globalWindow.handleHeatmapClick(cpuIdx, memIdx);
            }
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ["#10b981"],
      xaxis: {
        title: {
          text: "Memory Range (GB)",
        },
        labels: {
          rotate: -45,
          rotateAlways: true,
        },
      },
      yaxis: {
        title: {
          text: "CPU Range (cores)",
        },
      },
      tooltip: {
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const dataPoint = w.config.series[seriesIndex].data[dataPointIndex];
          const count = dataPoint.originalCount || 0;
          const memoryRange = dataPoint.x;
          const cpuRange = w.config.series[seriesIndex].name;
          return `
            <div style="padding: 8px 12px; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <div style="font-weight: 500; margin-bottom: 4px;">${count} Pods</div>
              <div style="font-size: 12px; margin-bottom: 4px;">
                <span style="color: hsl(var(--muted-foreground));">CPU:</span>
                <span style="margin-left: 4px;">${cpuRange}</span>
              </div>
              <div style="font-size: 12px;">
                <span style="color: hsl(var(--muted-foreground));">Memory:</span>
                <span style="margin-left: 4px;">${memoryRange}</span>
              </div>
            </div>
          `;
        },
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          colorScale: {
            inverse: false,
            min: 0,
            max: maxCount > 0 ? Math.log10(maxCount + 1) : 1,
            ranges: [
              {
                from: 0,
                to: 0,
                color: "#f3f4f6",
                name: "0",
              },
              {
                from: 0.001,
                to: maxCount > 0 ? Math.log10(maxCount + 1) : 1,
                color: "#10b981",
                name: "Pods",
              },
            ],
          },
        },
      },
    };

    return {
      heatmapData: series,
      chartOptions: options,
      minMemory,
      maxMemory,
      minCpu,
      maxCpu,
      memoryStep,
      cpuStep,
      memoryBuckets,
      cpuBuckets,
    };
  }, [podResourceData]);

  // Aggregate Node data into buckets for heatmap
  const {
    heatmapData: nodeHeatmapData,
    chartOptions: nodeChartOptions,
    minMemory: nodeMinMemory,
    maxMemory: nodeMaxMemory,
    minCpu: nodeMinCpu,
    maxCpu: nodeMaxCpu,
    memoryStep: nodeMemoryStep,
    cpuStep: nodeCpuStep,
    memoryBuckets: nodeMemoryBuckets,
    cpuBuckets: nodeCpuBuckets,
  } = useMemo(() => {
    if (nodeResourceData.length === 0) {
      return {
        heatmapData: [],
        chartOptions: {},
        minMemory: 0,
        maxMemory: 0,
        minCpu: 0,
        maxCpu: 0,
        memoryStep: 0,
        cpuStep: 0,
        memoryBuckets: 0,
        cpuBuckets: 0,
      };
    }

    // Find min/max for bucket ranges (convert to GB)
    const memoryValues = nodeResourceData.map(
      (n) => n.memory / (1024 * 1024 * 1024),
    );
    const cpuValues = nodeResourceData.map((n) => n.cpu / 1000);

    const minMemory = Math.min(...memoryValues);
    const maxMemory = Math.max(...memoryValues);
    const minCpu = Math.min(...cpuValues);
    const maxCpu = Math.max(...cpuValues);

    // Create buckets - 20x20 grid for heatmap
    const memoryBuckets = 40;
    const cpuBuckets = 20;
    const memoryStep = (maxMemory - minMemory) / memoryBuckets || 1;
    const cpuStep = (maxCpu - minCpu) / cpuBuckets || 1;

    // Initialize 2D array for counting nodes in each bucket
    const bucketCounts: number[][] = Array(cpuBuckets)
      .fill(0)
      .map(() => Array(memoryBuckets).fill(0));

    // Count nodes in each bucket
    nodeResourceData.forEach((node) => {
      const memoryGB = node.memory / (1024 * 1024 * 1024);
      const cpuCores = node.cpu / 1000;

      const memBucket = Math.min(
        Math.floor((memoryGB - minMemory) / memoryStep),
        memoryBuckets - 1,
      );
      const cpuBucket = Math.min(
        Math.floor((cpuCores - minCpu) / cpuStep),
        cpuBuckets - 1,
      );

      bucketCounts[cpuBucket][memBucket]++;
    });

    // Find max count for log scale normalization
    const maxCount = Math.max(...bucketCounts.flat());

    // Convert to heatmap series format with log scale
    const series = bucketCounts.map((row, cpuIdx) => ({
      name: `${(minCpu + cpuIdx * cpuStep).toFixed(2)}-${(minCpu + (cpuIdx + 1) * cpuStep).toFixed(2)} cores`,
      data: row.map((count, memIdx) => ({
        x: `${(minMemory + memIdx * memoryStep).toFixed(1)}-${(minMemory + (memIdx + 1) * memoryStep).toFixed(1)} GB`,
        y: count > 0 ? Math.log10(count + 1) : 0, // Log scale transformation
        originalCount: count, // Keep original count for tooltip
      })),
    }));

    const options: ApexOptions = {
      chart: {
        type: "heatmap",
        toolbar: {
          show: true,
        },
        animations: {
          enabled: false,
        },
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            const cpuIdx = config.seriesIndex;
            const memIdx = config.dataPointIndex;
            const globalWindow = window as typeof window & {
              handleNodeHeatmapClick?: (cpuIdx: number, memIdx: number) => void;
            };
            if (globalWindow.handleNodeHeatmapClick) {
              globalWindow.handleNodeHeatmapClick(cpuIdx, memIdx);
            }
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ["#3b82f6"],
      xaxis: {
        title: {
          text: "Memory Range (GB)",
        },
        labels: {
          rotate: -45,
          rotateAlways: true,
        },
      },
      yaxis: {
        title: {
          text: "CPU Range (cores)",
        },
      },
      tooltip: {
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const dataPoint = w.config.series[seriesIndex].data[dataPointIndex];
          const count = dataPoint.originalCount || 0;
          const memoryRange = dataPoint.x;
          const cpuRange = w.config.series[seriesIndex].name;
          return `
            <div style="padding: 8px 12px; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <div style="font-weight: 500; margin-bottom: 4px;">${count} Nodes</div>
              <div style="font-size: 12px; margin-bottom: 4px;">
                <span style="color: hsl(var(--muted-foreground));">CPU:</span>
                <span style="margin-left: 4px;">${cpuRange}</span>
              </div>
              <div style="font-size: 12px;">
                <span style="color: hsl(var(--muted-foreground));">Memory:</span>
                <span style="margin-left: 4px;">${memoryRange}</span>
              </div>
            </div>
          `;
        },
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          colorScale: {
            inverse: false,
            min: 0,
            max: maxCount > 0 ? Math.log10(maxCount + 1) : 1,
            ranges: [
              {
                from: 0,
                to: 0,
                color: "#f3f4f6",
                name: "0",
              },
              {
                from: 0.001,
                to: maxCount > 0 ? Math.log10(maxCount + 1) : 1,
                color: "#3b82f6",
                name: "Nodes",
              },
            ],
          },
        },
      },
    };

    return {
      heatmapData: series,
      chartOptions: options,
      minMemory,
      maxMemory,
      minCpu,
      maxCpu,
      memoryStep,
      cpuStep,
      memoryBuckets,
      cpuBuckets,
    };
  }, [nodeResourceData]);

  // Handle Pod heatmap cell click
  const handlePodCellClick = useCallback(
    (cpuIdx: number, memIdx: number) => {
      const cpuMin = podMinCpu + cpuIdx * podCpuStep;
      const cpuMax = podMinCpu + (cpuIdx + 1) * podCpuStep;
      const memoryMin = podMinMemory + memIdx * podMemoryStep;
      const memoryMax = podMinMemory + (memIdx + 1) * podMemoryStep;

      // Check if this is the last bucket in each dimension
      const isLastCpuBucket = cpuIdx === podCpuBuckets - 1;
      const isLastMemoryBucket = memIdx === podMemoryBuckets - 1;

      setSelectedRange({ cpuMin, cpuMax, memoryMin, memoryMax });

      // Filter pods in this range
      const podsInRange = podResourceData.filter((pod) => {
        const podMemoryGB = pod.memory / (1024 * 1024 * 1024);
        const podCpuCores = pod.cpu / 1000;
        return (
          podCpuCores >= cpuMin &&
          (isLastCpuBucket ? podCpuCores <= podMaxCpu : podCpuCores < cpuMax) &&
          podMemoryGB >= memoryMin &&
          (isLastMemoryBucket
            ? podMemoryGB <= podMaxMemory
            : podMemoryGB < memoryMax)
        );
      });

      // Limit to 100 pods
      setSelectedCellPods(podsInRange.slice(0, 100));
      setSelectedCellNodes([]);
    },
    [
      podMinCpu,
      podMaxCpu,
      podMinMemory,
      podMaxMemory,
      podCpuStep,
      podMemoryStep,
      podCpuBuckets,
      podMemoryBuckets,
      podResourceData,
    ],
  );

  // Handle Node heatmap cell click
  const handleNodeCellClick = useCallback(
    (cpuIdx: number, memIdx: number) => {
      const cpuMin = nodeMinCpu + cpuIdx * nodeCpuStep;
      const cpuMax = nodeMinCpu + (cpuIdx + 1) * nodeCpuStep;
      const memoryMin = nodeMinMemory + memIdx * nodeMemoryStep;
      const memoryMax = nodeMinMemory + (memIdx + 1) * nodeMemoryStep;

      // Check if this is the last bucket in each dimension
      const isLastCpuBucket = cpuIdx === nodeCpuBuckets - 1;
      const isLastMemoryBucket = memIdx === nodeMemoryBuckets - 1;

      setSelectedRange({ cpuMin, cpuMax, memoryMin, memoryMax });

      // Filter nodes in this range
      const nodesInRange = nodeResourceData.filter((node) => {
        const nodeMemoryGB = node.memory / (1024 * 1024 * 1024);
        const nodeCpuCores = node.cpu / 1000;
        return (
          nodeCpuCores >= cpuMin &&
          (isLastCpuBucket
            ? nodeCpuCores <= nodeMaxCpu
            : nodeCpuCores < cpuMax) &&
          nodeMemoryGB >= memoryMin &&
          (isLastMemoryBucket
            ? nodeMemoryGB <= nodeMaxMemory
            : nodeMemoryGB < memoryMax)
        );
      });

      setSelectedCellNodes(nodesInRange);
      setSelectedCellPods([]);
    },
    [
      nodeMinCpu,
      nodeMaxCpu,
      nodeMinMemory,
      nodeMaxMemory,
      nodeCpuStep,
      nodeMemoryStep,
      nodeCpuBuckets,
      nodeMemoryBuckets,
      nodeResourceData,
    ],
  );

  // Register click handlers on window for ApexCharts callbacks
  useEffect(() => {
    const globalWindow = window as typeof window & {
      handleHeatmapClick?: (cpuIdx: number, memIdx: number) => void;
      handleNodeHeatmapClick?: (cpuIdx: number, memIdx: number) => void;
    };
    globalWindow.handleHeatmapClick = handlePodCellClick;
    globalWindow.handleNodeHeatmapClick = handleNodeCellClick;
    return () => {
      delete globalWindow.handleHeatmapClick;
      delete globalWindow.handleNodeHeatmapClick;
    };
  }, [handlePodCellClick, handleNodeCellClick]);

  // Handle pod row click
  const handlePodClick = useCallback(
    (pod: PodResourceData) => {
      const podId = `${pod.namespace}/${pod.name}`;
      setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
    },
    [setLocation],
  );

  // Handle node row click
  const handleNodeClick = useCallback(
    (node: NodeResourceData) => {
      setLocation(`${PREFIX}/nodes?node=${encodeURIComponent(node.name)}`);
    },
    [setLocation],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Resource Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdatedLabel && (
            <span className="text-sm text-muted-foreground">
              Last updated {lastUpdatedLabel}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="pods">Pods</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
        </TabsList>

        {/* Pods Tab */}
        <TabsContent value="pods" className="space-y-4">
          {/* Pod Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{podStats.total}</div>
                <p className="text-muted-foreground text-xs">
                  With metrics available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCpu(podStats.avgCpu)}
                </div>
                <p className="text-muted-foreground text-xs">Per pod</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(podStats.avgMemory)}
                </div>
                <p className="text-muted-foreground text-xs">Per pod</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCpu(podStats.maxCpu)}
                </div>
                <p className="text-muted-foreground text-xs">Single pod</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Max Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(podStats.maxMemory)}
                </div>
                <p className="text-muted-foreground text-xs">Single pod</p>
              </CardContent>
            </Card>
          </div>

          {/* Pod Heatmap Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pod Resource Distribution Heatmap</CardTitle>
              <p className="text-muted-foreground text-sm">
                Density visualization showing pod concentration by CPU (cores)
                and Memory (GB) usage ranges (optimized for large clusters)
              </p>
            </CardHeader>
            <CardContent>
              {podHeatmapData.length === 0 ? (
                <div className="flex h-[600px] items-center justify-center">
                  <p className="text-muted-foreground">
                    No pod metrics available. Ensure metrics-server is installed
                    and running.
                  </p>
                </div>
              ) : (
                <div className="h-[600px] w-full">
                  <ReactApexChart
                    options={podChartOptions}
                    series={podHeatmapData}
                    type="heatmap"
                    height="100%"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          {selectedCellPods.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Understanding the Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Darker colors</span> indicate
                    more pods are using that combination of CPU and Memory
                    resources.
                  </p>
                  <p>
                    <span className="font-medium">Lighter colors</span> indicate
                    fewer pods in that resource range.
                  </p>
                  <p className="text-muted-foreground">
                    This aggregated view efficiently handles clusters with tens
                    of thousands of pods while showing resource usage patterns
                    and trends.
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    💡 Click on any cell to see the pods in that resource range
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Cell Pods */}
          {selectedCellPods.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pods in Selected Range</CardTitle>
                    {selectedRange && (
                      <>
                        <p className="text-muted-foreground mt-1 text-sm">
                          CPU: {selectedRange.cpuMin.toFixed(2)} -{" "}
                          {selectedRange.cpuMax.toFixed(2)} cores | Memory:{" "}
                          {selectedRange.memoryMin.toFixed(2)} -{" "}
                          {selectedRange.memoryMax.toFixed(2)} GB
                          {selectedCellPods.length >= 100 && (
                            <span className="ml-2 text-orange-500">
                              (Showing first 100 pods)
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Click on any pod to view details
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCellPods([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namespace</TableHead>
                        <TableHead>Pod Name</TableHead>
                        <TableHead className="text-right">CPU</TableHead>
                        <TableHead className="text-right">Memory</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCellPods.map((pod, idx) => (
                        <TableRow
                          key={`${pod.namespace}-${pod.name}-${idx}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePodClick(pod)}
                        >
                          <TableCell className="font-medium">
                            {pod.namespace}
                          </TableCell>
                          <TableCell>{pod.name}</TableCell>
                          <TableCell className="font-mono text-right">
                            {formatCpu(pod.cpu)}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatBytes(pod.memory)}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{pod.status}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          {/* Node Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Nodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nodeStats.total}</div>
                <p className="text-muted-foreground text-xs">
                  With metrics available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCpu(nodeStats.avgCpu)}
                </div>
                <p className="text-muted-foreground text-xs">Per node</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(nodeStats.avgMemory)}
                </div>
                <p className="text-muted-foreground text-xs">Per node</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max CPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCpu(nodeStats.maxCpu)}
                </div>
                <p className="text-muted-foreground text-xs">Single node</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Max Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(nodeStats.maxMemory)}
                </div>
                <p className="text-muted-foreground text-xs">Single node</p>
              </CardContent>
            </Card>
          </div>

          {/* Node Heatmap Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Node Resource Distribution Heatmap</CardTitle>
              <p className="text-muted-foreground text-sm">
                Density visualization showing node concentration by CPU (cores)
                and Memory (GB) usage ranges
              </p>
            </CardHeader>
            <CardContent>
              {nodeHeatmapData.length === 0 ? (
                <div className="flex h-[600px] items-center justify-center">
                  <p className="text-muted-foreground">
                    No node metrics available. Ensure metrics-server is
                    installed and running.
                  </p>
                </div>
              ) : (
                <div className="h-[600px] w-full">
                  <ReactApexChart
                    options={nodeChartOptions}
                    series={nodeHeatmapData}
                    type="heatmap"
                    height="100%"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          {selectedCellNodes.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Understanding the Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Darker colors</span> indicate
                    more nodes are using that combination of CPU and Memory
                    resources.
                  </p>
                  <p>
                    <span className="font-medium">Lighter colors</span> indicate
                    fewer nodes in that resource range.
                  </p>
                  <p className="text-muted-foreground">
                    This view shows the distribution of node resource usage
                    across your cluster.
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    💡 Click on any cell to see the nodes in that resource range
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Cell Nodes */}
          {selectedCellNodes.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Nodes in Selected Range</CardTitle>
                    {selectedRange && (
                      <>
                        <p className="text-muted-foreground mt-1 text-sm">
                          CPU: {selectedRange.cpuMin.toFixed(2)} -{" "}
                          {selectedRange.cpuMax.toFixed(2)} cores | Memory:{" "}
                          {selectedRange.memoryMin.toFixed(2)} -{" "}
                          {selectedRange.memoryMax.toFixed(2)} GB
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Click on any node to view details
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCellNodes([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Node Name</TableHead>
                        <TableHead className="text-right">CPU</TableHead>
                        <TableHead className="text-right">Memory</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCellNodes.map((node, idx) => (
                        <TableRow
                          key={`${node.name}-${idx}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleNodeClick(node)}
                        >
                          <TableCell className="font-medium">
                            {node.name}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatCpu(node.cpu)}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {formatBytes(node.memory)}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{node.status}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

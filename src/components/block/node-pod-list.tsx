"use client";

import type { PodObject, PodMetricsObject, NodeObject } from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { getStatus, Status } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { PREFIX } from "@/lib/const";
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface NodePodListProps {
  pods: PodObject[];
  node: NodeObject;
}

interface PodResourceInfo {
  cpu: {
    usage?: number;
    requests: number;
    limits: number;
  };
  memory: {
    usage?: number;
    requests: number;
    limits: number;
  };
}

type MetricType =
  | "cpu-usage"
  | "cpu-requests"
  | "memory-usage"
  | "memory-requests";

function calculatePodResourceInfo(
  pod: PodObject,
  podMetrics?: PodMetricsObject,
): PodResourceInfo {
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
      usage: cpuUsage,
      requests: cpuRequests,
      limits: cpuLimits,
    },
    memory: {
      usage: memoryUsage,
      requests: memoryRequests,
      limits: memoryLimits,
    },
  };
}

export default function NodePodList({ pods, node }: NodePodListProps) {
  const [, setLocation] = useLocation();
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("memory-usage");
  const podMetricsData = useKuview("metrics.k8s.io/v1beta1/PodMetrics");

  const handlePodClick = (podName: string, namespace: string) => {
    const podId = `${namespace}/${podName}`;
    setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
  };

  const { chartData, chartOptions, nodeCapacity, usedValue } = useMemo(() => {
    const podsWithResourceInfo = pods.map((pod) => {
      const podMetrics =
        podMetricsData[`${pod.metadata.namespace}/${pod.metadata.name}`];
      const resourceInfo = calculatePodResourceInfo(pod, podMetrics);
      return {
        pod,
        resourceInfo,
      };
    });

    // Get node capacity
    let nodeCapacityValue = 0;
    if (node.status?.allocatable) {
      switch (selectedMetric) {
        case "cpu-usage":
        case "cpu-requests":
          nodeCapacityValue = parseCpu(node.status.allocatable.cpu || "0");
          break;
        case "memory-usage":
        case "memory-requests":
          nodeCapacityValue = parseMemory(
            node.status.allocatable.memory || "0",
          );
          break;
      }
    }

    // Calculate chart data based on selected metric
    const podData = podsWithResourceInfo
      .map(({ pod, resourceInfo }) => {
        let value = 0;
        let hasValue = false;

        switch (selectedMetric) {
          case "cpu-usage":
            if (resourceInfo.cpu.usage !== undefined) {
              value = resourceInfo.cpu.usage;
              hasValue = true;
            }
            break;
          case "cpu-requests":
            if (resourceInfo.cpu.requests > 0) {
              value = resourceInfo.cpu.requests;
              hasValue = true;
            }
            break;
          case "memory-usage":
            if (resourceInfo.memory.usage !== undefined) {
              value = resourceInfo.memory.usage;
              hasValue = true;
            }
            break;
          case "memory-requests":
            if (resourceInfo.memory.requests > 0) {
              value = resourceInfo.memory.requests;
              hasValue = true;
            }
            break;
        }

        return {
          pod,
          value,
          hasValue,
        };
      })
      .filter(({ hasValue }) => hasValue)
      .sort((a, b) => b.value - a.value)
      .map(({ pod, value }) => ({
        x: `${pod.metadata.name}`,
        y: value,
        namespace: pod.metadata.namespace,
        status: getStatus(pod).status,
        type: "pod",
      }));

    const usedValue = podData.reduce((sum, item) => sum + item.y, 0);
    const availableValue = Math.max(0, nodeCapacityValue - usedValue);

    // Add available/unused space to chart data
    const chartData = [...podData];
    if (availableValue > 0) {
      chartData.push({
        x: "Available",
        y: availableValue,
        namespace: "",
        status: Status.Running,
        type: "available",
      });
    }

    const totalValue = usedValue + availableValue;

    const chartOptions: ApexOptions = {
      chart: {
        type: "treemap",
        height: 400,
        events: {
          dataPointSelection: (event, chartContext, { dataPointIndex }) => {
            const selectedData = chartData[dataPointIndex];
            if (
              selectedData &&
              typeof selectedData.x === "string" &&
              selectedData.namespace &&
              selectedData.type === "pod"
            ) {
              handlePodClick(selectedData.x, selectedData.namespace);
            }
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "12px",
          fontWeight: "bold",
        },
        formatter: function (text, op) {
          const value = op.value;
          const percentage =
            totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : "0";

          let formattedValue = "";
          if (selectedMetric.includes("cpu")) {
            formattedValue = formatCpu(value);
          } else {
            formattedValue = formatBytes(value);
          }

          return [`${text}`, `${formattedValue}`, `(${percentage}%)`];
        },
      },
      plotOptions: {
        treemap: {
          enableShades: false,
          distributed: true,
        },
      },
      colors: chartData.map((item) => {
        if (item.type === "available") {
          return "#e5e7eb"; // Light gray for available space
        }

        // Use different colors based on pod size relative to total used resources
        const podUsagePercent = usedValue > 0 ? (item.y / usedValue) * 100 : 0;

        if (podUsagePercent > 20) {
          return "#34d399";
        } else if (podUsagePercent > 10) {
          return "#6ee7b7";
        } else {
          return "#a7f3d0";
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tooltip: {
        custom: function ({ dataPointIndex }) {
          const data = chartData[dataPointIndex];
          if (!data) return "";

          let formattedValue = "";
          if (selectedMetric.includes("cpu")) {
            formattedValue = formatCpu(data.y);
          } else {
            formattedValue = formatBytes(data.y);
          }

          const percentage =
            totalValue > 0 ? ((data.y / totalValue) * 100).toFixed(1) : "0";

          if (data.type === "available") {
            return `
              <div class="px-3 py-2 bg-white border rounded shadow-lg">
                <div class="font-semibold text-blue-600">${data.x}</div>
                <div class="text-sm">Value: ${formattedValue}</div>
                <div class="text-sm">Percentage: ${percentage}%</div>
                <div class="text-xs text-gray-500">Unused node capacity</div>
              </div>
            `;
          }

          return `
            <div class="px-3 py-2 bg-white border rounded shadow-lg">
              <div class="font-semibold">${data.x}</div>
              <div class="text-sm text-gray-600">Namespace: ${data.namespace}</div>
              <div class="text-sm">Value: ${formattedValue}</div>
              <div class="text-sm">Percentage: ${percentage}%</div>
            </div>
          `;
        },
      },
    };

    return {
      chartData,
      chartOptions,
      totalValue,
      nodeCapacity: nodeCapacityValue,
      usedValue,
    };
  }, [pods, podMetricsData, selectedMetric, node]);

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case "cpu-usage":
        return "CPU Usage";
      case "cpu-requests":
        return "CPU Requests";
      case "memory-usage":
        return "Memory Usage";
      case "memory-requests":
        return "Memory Requests";
    }
  };

  const getCapacityFormatted = () => {
    if (selectedMetric.includes("cpu")) {
      return formatCpu(nodeCapacity);
    } else {
      return formatBytes(nodeCapacity);
    }
  };

  const getUsedValueFormatted = () => {
    if (selectedMetric.includes("cpu")) {
      return formatCpu(usedValue);
    } else {
      return formatBytes(usedValue);
    }
  };

  const getUtilizationPercentage = () => {
    if (nodeCapacity > 0) {
      return ((usedValue / nodeCapacity) * 100).toFixed(1);
    }
    return "0";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pod Resources ({pods.length})
          <div className="text-sm text-muted-foreground flex justify-end gap-3">
            <div>
              {getUsedValueFormatted()} / {getCapacityFormatted()} (
              {getUtilizationPercentage()}%)
            </div>
          </div>
        </CardTitle>
        <div className="pt-4">
          <RadioGroup
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value as MetricType)}
            className="grid grid-cols-4 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cpu-usage" id="cpu-usage" />
              <Label htmlFor="cpu-usage" className="text-sm">
                CPU Usage
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cpu-requests" id="cpu-requests" />
              <Label htmlFor="cpu-requests" className="text-sm">
                CPU Requests
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="memory-usage" id="memory-usage" />
              <Label htmlFor="memory-usage" className="text-sm">
                Memory Usage
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="memory-requests" id="memory-requests" />
              <Label htmlFor="memory-requests" className="text-sm">
                Memory Requests
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent>
        {pods.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No pods running on this node
          </p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No data available for {getMetricLabel(selectedMetric)}
          </p>
        ) : (
          <div className="w-full">
            <Chart
              options={chartOptions}
              series={[{ data: chartData }]}
              type="treemap"
              height={400}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

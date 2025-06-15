"use client";

import type { PodObject, PodMetricsObject } from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { getStatusColor, getStatus } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PREFIX } from "@/lib/const";
import { useMemo, useState } from "react";

interface NodePodListProps {
  pods: PodObject[];
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

export default function NodePodList({ pods }: NodePodListProps) {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<"cpu" | "memory">("memory");
  const podMetricsData = useKuview("metrics.k8s.io/v1beta1/PodMetrics");

  const handlePodClick = (pod: PodObject) => {
    const podId = `${pod.metadata.namespace}/${pod.metadata.name}`;
    setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
  };

  const data = useMemo(() => {
    return pods
      .map((pod) => {
        const podMetrics =
          podMetricsData[`${pod.metadata.namespace}/${pod.metadata.name}`];
        const resourceInfo = calculatePodResourceInfo(pod, podMetrics);
        return {
          pod,
          resourceInfo,
        };
      })
      .sort((a, b) => {
        // sort by selected resource usage
        let aUsage = 0;
        let bUsage = 0;

        if (sortBy === "cpu") {
          aUsage = a.resourceInfo.cpu.usage || 0;
          bUsage = b.resourceInfo.cpu.usage || 0;
        } else {
          aUsage = a.resourceInfo.memory.usage || 0;
          bUsage = b.resourceInfo.memory.usage || 0;
        }

        return bUsage - aUsage;
      });
  }, [pods, podMetricsData, sortBy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pod Resources ({pods.length})
          <div className="flex gap-1 items-center">
            <p className="text-sm text-muted-foreground ">Sort by:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortBy((prev) => (prev === "cpu" ? "memory" : "cpu"));
              }}
              className="w-20"
            >
              {sortBy === "cpu" ? "CPU" : "Memory"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[250px] overflow-y-auto">
          {pods.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No pods running on this node
            </p>
          ) : (
            <div className="divide-y">
              {data.map(({ pod, resourceInfo }) => {
                const status = getStatus(pod);

                return (
                  <div
                    key={`${pod.metadata.namespace}/${pod.metadata.name}`}
                    className="grid grid-cols-5 gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handlePodClick(pod)}
                  >
                    {/* Pod Status */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}
                      />
                    </div>

                    {/* Pod Namespace & Name */}
                    <div className="col-span-2 space-y-1">
                      <div className="text-sm font-medium truncate">
                        {pod.metadata.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pod.metadata.namespace}
                      </div>
                    </div>

                    {/* CPU Usage, Request, Limit */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium">CPU</div>
                      <div className="text-xs space-y-0.5">
                        {resourceInfo.cpu.usage !== undefined && (
                          <div className="text-blue-700">
                            Usage: {formatCpu(resourceInfo.cpu.usage)}
                          </div>
                        )}
                        {resourceInfo.cpu.requests > 0 && (
                          <div className="text-blue-500">
                            Req: {formatCpu(resourceInfo.cpu.requests)}
                          </div>
                        )}
                        {resourceInfo.cpu.limits > 0 && (
                          <div className="text-blue-500">
                            Limit: {formatCpu(resourceInfo.cpu.limits)}
                          </div>
                        )}
                        {resourceInfo.cpu.usage === undefined &&
                          resourceInfo.cpu.requests === 0 &&
                          resourceInfo.cpu.limits === 0 && (
                            <div className="text-muted-foreground">-</div>
                          )}
                      </div>
                    </div>

                    {/* Memory Usage, Request, Limit */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Memory</div>
                      <div className="text-xs space-y-0.5">
                        {resourceInfo.memory.usage !== undefined && (
                          <div className="text-green-700">
                            Usage: {formatBytes(resourceInfo.memory.usage)}
                          </div>
                        )}
                        {resourceInfo.memory.requests > 0 && (
                          <div className="text-green-500">
                            Req: {formatBytes(resourceInfo.memory.requests)}
                          </div>
                        )}
                        {resourceInfo.memory.limits > 0 && (
                          <div className="text-green-500">
                            Limit: {formatBytes(resourceInfo.memory.limits)}
                          </div>
                        )}
                        {resourceInfo.memory.usage === undefined &&
                          resourceInfo.memory.requests === 0 &&
                          resourceInfo.memory.limits === 0 && (
                            <div className="text-muted-foreground">-</div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

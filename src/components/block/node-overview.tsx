import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
import { podStatus, Status, STATUS_COLORS } from "@/lib/status";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ResourceBar from "./resource-bar";
import { PREFIX } from "@/lib/const";

interface NodeOverviewProps {
  node: NodeObject;
}

interface ResourceUsage {
  cpu: {
    capacity: number; // millicores
    requests: number; // millicores
    limits: number; // millicores
  };
  memory: {
    capacity: number; // bytes
    requests: number; // bytes
    limits: number; // bytes
  };
}

function calculateResourceUsage(
  node: NodeObject,
  nodePods: PodObject[],
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

  return {
    cpu: {
      capacity: cpuCapacity,
      requests: cpuRequests,
      limits: cpuLimits,
    },
    memory: {
      capacity: memoryCapacity,
      requests: memoryRequests,
      limits: memoryLimits,
    },
  };
}

export default function NodeOverview({ node }: NodeOverviewProps) {
  const podsData = useKuview("v1/Pod");
  const [, setLocation] = useLocation();

  // Filter pods that belong to the selected node
  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  const resourceUsage = calculateResourceUsage(node, nodePods);

  const handlePodClick = (pod: PodObject) => {
    const podId = `${pod.metadata.namespace}/${pod.metadata.name}`;
    setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
  };

  const getStatusColor = (pod: PodObject) => {
    const status = podStatus(pod);
    switch (status) {
      case Status.Running:
        return STATUS_COLORS.Running.color + " animate-pulse";
      case Status.Pending:
        return STATUS_COLORS.Pending.color;
      case Status.Error:
        return STATUS_COLORS.Error.color + " animate-bounce";
      case Status.Done:
        return STATUS_COLORS.Done.color;
      case Status.Warning:
        return STATUS_COLORS.Warning.color + " animate-caret-blink";
      case Status.Terminating:
        return STATUS_COLORS.Terminating.color + " animate-pulse";
      default:
        return STATUS_COLORS.Pending.color;
    }
  };

  return (
    <div className="space-y-4">
      {/* Pods */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">
                Pods ({nodePods.length})
              </h3>
              <div className="flex flex-wrap gap-0.5">
                <TooltipProvider>
                  {nodePods.map((pod) => (
                    <Tooltip
                      key={`${pod.metadata.namespace}/${pod.metadata.name}`}
                    >
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 cursor-pointer border border-gray-300 hover:border-gray-600 transition-all  ${getStatusColor(pod)}`}
                          onClick={() => handlePodClick(pod)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{pod.metadata.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Namespace: {pod.metadata.namespace}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {podStatus(pod)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              {nodePods.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No pods running on this node
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResourceBar
            title="CPU"
            requests={resourceUsage.cpu.requests}
            limits={resourceUsage.cpu.limits}
            capacity={resourceUsage.cpu.capacity}
            formatValue={formatCpu}
          />
          <ResourceBar
            title="Memory"
            requests={resourceUsage.memory.requests}
            limits={resourceUsage.memory.limits}
            capacity={resourceUsage.memory.capacity}
            formatValue={formatBytes}
          />
        </CardContent>
      </Card>
    </div>
  );
}

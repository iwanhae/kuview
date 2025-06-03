import type { PodObject } from "@/lib/kuview";
import { podStatus, Status, STATUS_COLORS } from "@/lib/status";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PREFIX } from "@/lib/const";

interface NodePodsGridProps {
  pods: PodObject[];
}

export default function NodePodsGrid({ pods }: NodePodsGridProps) {
  const [, setLocation] = useLocation();

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
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Pods ({pods.length})</h3>
            <div className="flex flex-wrap gap-0.5">
              <TooltipProvider>
                {pods.map((pod) => (
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
            {pods.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No pods running on this node
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

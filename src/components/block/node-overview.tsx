import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
import { podStatus, Status } from "@/lib/status";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PREFIX } from "@/lib/const";

interface NodeOverviewProps {
  node: NodeObject;
}

export default function NodeOverview({ node }: NodeOverviewProps) {
  const podsData = useKuview("v1/Pod");
  const [, setLocation] = useLocation();

  // Filter pods that belong to the selected node
  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  const handlePodClick = (pod: PodObject) => {
    const podId = `${pod.metadata.namespace}/${pod.metadata.name}`;
    setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
  };

  const getStatusColor = (pod: PodObject) => {
    const status = podStatus(pod);
    switch (status) {
      case Status.Running:
        return "bg-green-500";
      case Status.Pending:
        return "bg-yellow-500";
      case Status.Error:
        return "bg-red-500";
      case Status.Done:
        return "bg-blue-500";
      case Status.Warning:
        return "bg-orange-500";
      case Status.Terminating:
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
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
                        className={`w-3 h-3 cursor-pointer border border-gray-300 hover:border-gray-600 transition-colors ${getStatusColor(pod)}`}
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
  );
}

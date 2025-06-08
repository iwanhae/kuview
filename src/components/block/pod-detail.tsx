import type { PodObject } from "@/lib/kuview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MetadataComponent from "./metadata";
import PodSpecComponent from "./pod-spec";
import PodStatusComponent from "./pod-status";
import { cn } from "@/lib/utils";
import PodsGrid from "./pods-grid";
import { useKuview } from "@/hooks/useKuview";
import { podStatus } from "@/lib/status";
import { getStatusColor } from "@/lib/status";

interface PodDetailProps {
  pod: PodObject;
  className?: string;
}

export default function PodDetail({ pod, className }: PodDetailProps) {
  const pods = useKuview("v1/Pod");
  const [jsonExpanded, setJsonExpanded] = useState(false);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{pod.metadata.name}</h2>
        <p className="text-sm text-muted-foreground">
          {pod.metadata.namespace ? `${pod.metadata.namespace}/` : ""}
          {pod.metadata.name}
        </p>
      </div>

      {(() => {
        const condition = podStatus(pod);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 ${getStatusColor(condition.status)}`} />
            <div className="text-sm text-muted-foreground">
              {condition.reason}
            </div>
          </div>
        );
      })()}

      <PodsGrid
        title="Same node"
        pods={Object.values(pods).filter(
          (p) => p.spec.nodeName === pod.spec.nodeName,
        )}
      />

      <PodsGrid
        title="Same namespace"
        pods={Object.values(pods).filter(
          (p) => p.metadata.namespace === pod.metadata.namespace,
        )}
      />

      <PodsGrid
        title="Same owner"
        pods={Object.values(pods).filter((p) =>
          p.metadata.ownerReferences?.some((o) => {
            return o.uid === pod.metadata.ownerReferences?.[0]?.uid;
          }),
        )}
      />

      {/* Status Section */}
      <PodStatusComponent status={pod.status} />

      {/* Metadata Section */}
      <MetadataComponent metadata={pod.metadata} />

      {/* Spec Section */}
      <PodSpecComponent spec={pod.spec} />

      {/* JSON Original */}
      <Card>
        <Collapsible open={jsonExpanded} onOpenChange={setJsonExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle>JSON Original</CardTitle>
                <span className="text-xs">{jsonExpanded ? "▼" : "▶"}</span>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96 font-mono">
                {JSON.stringify(pod, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

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
import PodLogs from "./pod-logs";
import PodResourceUsage from "./pod-resource-usage";
import { PREFIX } from "@/lib/const";
import PodsVolumeList from "./pods-volume-list";
import MetadataHeader from "./metadata-header";

interface PodDetailProps {
  pod: PodObject;
  className?: string;
}

export default function PodDetail({ pod, className }: PodDetailProps) {
  const pods = useKuview("v1/Pod");
  const [jsonExpanded, setJsonExpanded] = useState(false);

  return (
    <div className={cn("space-y-6", className)}>
      <MetadataHeader object={pod} />

      {/* Pod Logs */}
      <PodLogs pod={pod} />

      {/* Resource Usage */}
      <PodResourceUsage pod={pod} />

      {/* Pods in the same node */}
      <PodsGrid
        title={`Node "${pod.spec.nodeName}"`}
        href={
          pod.spec.nodeName
            ? `${PREFIX}/nodes?node=${encodeURIComponent(pod.spec.nodeName)}`
            : undefined
        }
        pods={Object.values(pods).filter(
          (p) => p.spec.nodeName === pod.spec.nodeName,
        )}
      />

      {/* Pods in the same namespace */}
      <PodsGrid
        title={`Namespace "${pod.metadata.namespace}"`}
        href={`${PREFIX}/namespaces?namespace=${encodeURIComponent(pod.metadata.namespace ?? "")}`}
        pods={Object.values(pods).filter(
          (p) => p.metadata.namespace === pod.metadata.namespace,
        )}
      />

      {/* Pods with the same owner */}
      {pod.metadata.ownerReferences && (
        <PodsGrid
          title={`${pod.metadata.ownerReferences?.[0]?.kind} "${pod.metadata.ownerReferences?.[0]?.name}"`}
          pods={Object.values(pods).filter((p) =>
            p.metadata.ownerReferences?.some((o) => {
              return o.uid === pod.metadata.ownerReferences?.[0]?.uid;
            }),
          )}
        />
      )}

      {/* Volumes */}
      <PodsVolumeList pods={[pod]} />

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

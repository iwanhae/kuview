import type { NodeObject } from "@/lib/kuview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MetadataComponent from "./metadata";
import NodeSpecComponent from "./node-spec";
import NodeStatusComponent from "./node-status";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatus } from "@/lib/status";
import NodeResourceUsage from "./node-resource-usage";
import PodsGrid from "./pods-grid";
import { useKuview } from "@/hooks/useKuview";

interface NodeDetailProps {
  node: NodeObject;
  className?: string;
}

export default function NodeDetail({ node, className }: NodeDetailProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const podsData = useKuview("v1/Pod");

  // Filter pods that belong to the selected node
  const nodePods = Object.values(podsData).filter(
    (pod) => pod.spec.nodeName === node.metadata.name,
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <h2 className="text-xl font-semibold">{node.metadata.name}</h2>

      {(() => {
        const condition = getStatus(node);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 ${getStatusColor(condition.status)}`} />
            <div className="text-sm text-muted-foreground">
              {condition.reason}
            </div>
          </div>
        );
      })()}

      {/* Pods */}
      <PodsGrid pods={nodePods} />

      {/* Resource Usage */}
      <NodeResourceUsage node={node} />

      {/* Status Section */}
      <NodeStatusComponent status={node.status} />

      {/* Metadata Section */}
      <MetadataComponent metadata={node.metadata} />

      {/* Spec Section */}
      <NodeSpecComponent spec={node.spec} />

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
                {JSON.stringify(node, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

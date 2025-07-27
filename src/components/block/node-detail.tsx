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
import NodeResourceUsage from "./node-resource-usage";
import PodsGrid from "./pods-grid";
import NodePodList from "./node-pod-list";
import { usePodsByNode } from "@/hooks/usePodsByNode";
import PodsVolumeList from "./pods-volume-list";
import MetadataHeader from "./metadata-header";

interface NodeDetailProps {
  node: NodeObject;
  className?: string;
}

export default function NodeDetail({ node, className }: NodeDetailProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // Use optimized hook to get pods for this node
  const nodePods = usePodsByNode(node.metadata.name);

  return (
    <div className={cn("space-y-6", className)}>
      <MetadataHeader object={node} />

      {/* Pods */}
      <PodsGrid pods={nodePods} />

      {/* Resource Usage */}
      <NodeResourceUsage node={node} />

      {/* Pod List */}
      <NodePodList pods={nodePods} node={node} />

      {/* Volume List */}
      <PodsVolumeList pods={nodePods} />

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

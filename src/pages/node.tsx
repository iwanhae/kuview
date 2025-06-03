import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import type { NodeObject } from "@/lib/kuview";
import { nodeStatus } from "@/lib/status";

export default function NodePage() {
  const nodes = useKuview("v1/Node") as Record<string, NodeObject>;
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Nodes</h1>
      </div>

      {/* Search */}
      <SearchComponent<NodeObject>
        resources={Object.values(nodes)}
        getResourceId={(node) => node.metadata.name}
        getResourceStatus={nodeStatus}
        onResourceSelect={(id) => setSelectedNode(nodes[id] || null)}
        selectedResourceId={selectedNode?.metadata.name}
        resourceTypeName="node"
        urlResourceParam="node"
        urlFilterParam="nodeFilter"
      />

      {/* Node Details Section */}
      {selectedNode && <></>}
    </div>
  );
}

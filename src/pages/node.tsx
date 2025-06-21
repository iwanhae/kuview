import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import NodeDetail from "@/components/block/node-detail";
import type { NodeObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function NodePage() {
  const nodes = useKuview("v1/Node");
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2">
      {/* Left Panel - Node List */}
      <div className="flex flex-col gap-6 w-full px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Nodes</h1>
        </div>

        {/* Search */}
        <SearchComponent<NodeObject>
          resources={Object.values(nodes)}
          getResourceId={(node) => node.metadata.name}
          getResourceStatus={getStatus}
          onResourceSelect={(id) => setSelectedNode(nodes[id] || null)}
          selectedResourceId={selectedNode?.metadata.name}
          resourceTypeName="node"
          urlResourceParam="node"
          urlFilterParam="nodeFilter"
        />
      </div>

      {/* Right Panel - Node Detail */}
      {selectedNode && (
        <NodeDetail node={selectedNode} className="w-full px-4" />
      )}
    </div>
  );
}

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
      {selectedNode && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Node Details</h2>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 font-mono text-sm">
                {selectedNode.metadata.name}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Namespace:</span>
              <span className="ml-2 font-mono text-sm">
                {selectedNode.metadata.namespace || "N/A"}
              </span>
            </div>
            {/* Add more node details here as needed */}
            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-sm text-gray-600 mb-2">Raw Data Preview:</p>
              <pre className="text-xs text-gray-800 overflow-auto max-h-32">
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

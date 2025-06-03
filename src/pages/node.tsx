import { useKuview } from "@/hooks/useKuview";
import { useCallback, useMemo, useState } from "react";
import NodeSearch from "@/components/block/node-search";

interface Node {
  metadata: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export default function Node() {
  const nodes = useKuview("v1/Node");
  const [node, setNode] = useState<Node | null>(null);

  const handleNodeSelect = useCallback(
    (nodeName: string) => {
      console.log(nodeName, nodes);
      setNode(nodes[nodeName]);
    },
    [nodes],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Nodes</h1>
      </div>

      {/* Node Search and Selection */}
      <NodeSearch
        nodes={Object.values(nodes)}
        onNodeSelect={handleNodeSelect}
        selectedNodeName={node?.metadata.name}
      />

      {/* Node Details Section */}
      {node && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Node Details</h2>
            <button
              onClick={() => setNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 font-mono text-sm">
                {node.metadata.name}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Namespace:</span>
              <span className="ml-2 font-mono text-sm">
                {node.metadata.namespace || "N/A"}
              </span>
            </div>
            {/* Add more node details here as needed */}
            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-sm text-gray-600 mb-2">Raw Data Preview:</p>
              <pre className="text-xs text-gray-800 overflow-auto max-h-32">
                {JSON.stringify(node, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import type { NodeObject } from "@/lib/kuview";
import { useState, useMemo } from "react";

interface NodeSearchProps {
  nodes: NodeObject[];
  onNodeSelect?: (nodeName: string) => void;
  selectedNodeName?: string;
}

export default function NodeSearch({
  nodes,
  onNodeSelect,
  selectedNodeName,
}: NodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    return nodes.filter((node) =>
      node.metadata.name.toLowerCase().includes(lowercaseQuery),
    );
  }, [nodes, searchQuery]);

  // Calculate nodes for the current page
  const paginatedNodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNodes.slice(startIndex, endIndex);
  }, [filteredNodes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes by name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {paginatedNodes.length} of {filteredNodes.length} nodes
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {totalPages > 1 && (
          <span className="ml-4">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Node List */}
      {filteredNodes.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            {searchQuery
              ? "No nodes match your search."
              : "No nodes to display."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
          {paginatedNodes.map((node) => (
            <Row
              key={node.metadata.name}
              node={node}
              selectedNodeName={selectedNodeName}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  node: NodeObject;
  selectedNodeName?: string;
  onNodeSelect?: (nodeName: string) => void;
}

const Row = ({ node, selectedNodeName, onNodeSelect }: RowProps) => {
  const isSelected = selectedNodeName === node.metadata.name;

  return (
    <div
      className={`flex items-center px-4 py-2 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
      }`}
      onClick={() => onNodeSelect?.(node.metadata.name)}
    >
      <span
        className={`text-sm font-mono ${
          isSelected ? "text-blue-700 font-medium" : "text-gray-900"
        }`}
      >
        {node.metadata.name}
      </span>
    </div>
  );
};

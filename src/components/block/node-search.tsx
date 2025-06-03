import type { NodeObject } from "@/lib/kuview";
import { useState, useMemo, useEffect } from "react";
import {
  nodeStatus,
  Status,
  STATUS_COLORS,
  OVERVIEW_STATUS_ORDER,
} from "@/lib/status";

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
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const itemsPerPage = 100;

  // Nodes filtered by text search query (name or label)
  const nodesMatchingSearchQuery = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (!trimmedSearchQuery) {
      return nodes;
    }
    return nodes.filter((node) => {
      const nameMatch = node.metadata.name
        .toLowerCase()
        .includes(trimmedSearchQuery);
      const labelMatch = Object.values(node.metadata.labels || {}).some(
        (labelValue) =>
          String(labelValue).toLowerCase().includes(trimmedSearchQuery),
      );
      return nameMatch || labelMatch;
    });
  }, [nodes, searchQuery]);

  // Calculate counts for each status based on nodesMatchingSearchQuery
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = OVERVIEW_STATUS_ORDER.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<Status, number>,
    );
    nodesMatchingSearchQuery.forEach((node) => {
      const status = nodeStatus(node);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  }, [nodesMatchingSearchQuery]);

  // Filter nodes based on selected statuses
  const filteredNodes = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return nodesMatchingSearchQuery;
    }
    return nodesMatchingSearchQuery.filter((node) =>
      selectedStatuses.includes(nodeStatus(node)),
    );
  }, [nodesMatchingSearchQuery, selectedStatuses]);

  // Calculate nodes for the current page
  const paginatedNodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNodes.slice(startIndex, endIndex);
  }, [filteredNodes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);

  const handleNodeSelectInternal = (nodeName: string) => {
    onNodeSelect?.(nodeName);
    const params = new URLSearchParams(window.location.search);
    if (nodeName) {
      params.set("node", nodeName);
    } else {
      params.delete("node");
    }
    history.pushState(null, "", `?${params.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nodeNameFromUrl = params.get("node");
    if (nodeNameFromUrl && onNodeSelect) {
      onNodeSelect(nodeNameFromUrl);
    }

    const nodeFilterFromUrl = params.get("nodeFilter");
    if (nodeFilterFromUrl) {
      const statuses = nodeFilterFromUrl.split(",") as Status[];
      setSelectedStatuses(
        statuses.filter((s) => OVERVIEW_STATUS_ORDER.includes(s)),
      );
    }
  }, [onNodeSelect]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedStatuses.length > 0) {
      params.set("nodeFilter", selectedStatuses.join(","));
    } else {
      params.delete("nodeFilter");
    }
    history.pushState(null, "", `?${params.toString()}`);
  }, [selectedStatuses]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleStatusChange = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
    setCurrentPage(1); // Reset to first page on filter change
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

      {/* Results Count & Status Filter */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {paginatedNodes.length} of {filteredNodes.length} nodes
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedStatuses.length > 0 && ` (filtered by status)`}
        </div>
        <div className="flex items-center space-x-2">
          {OVERVIEW_STATUS_ORDER.map((status) => {
            const count = statusCounts[status];
            if (count === 0) return null; // Hide checkbox if count is 0
            return (
              <label
                key={status}
                className="flex items-center space-x-1 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => handleStatusChange(status)}
                  className="form-checkbox h-3 w-3 text-blue-600 rounded"
                />
                <span className={STATUS_COLORS[status].textColor}>
                  {status} ({count})
                </span>
              </label>
            );
          })}
        </div>
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
        <div className="border border-gray-200 rounded-lg overflow-hidden h-[200px] overflow-y-auto">
          {paginatedNodes.map((node) => (
            <Row
              key={node.metadata.name}
              node={node}
              nodeCurrentStatus={nodeStatus(node)}
              selectedNodeName={selectedNodeName}
              onNodeSelect={handleNodeSelectInternal}
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
  nodeCurrentStatus: Status;
  selectedNodeName?: string;
  onNodeSelect?: (nodeName: string) => void;
}

const Row = ({
  node,
  nodeCurrentStatus,
  selectedNodeName,
  onNodeSelect,
}: RowProps) => {
  const isSelected = selectedNodeName === node.metadata.name;
  const statusColor = STATUS_COLORS[nodeCurrentStatus]?.color || "bg-gray-500";

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
      }`}
      onClick={() => onNodeSelect?.(isSelected ? "" : node.metadata.name)}
    >
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 animate-pulse ${statusColor}`}
        />
        <span
          className={`text-sm font-mono ${
            isSelected ? "text-blue-700 font-medium" : "text-gray-900"
          }`}
        >
          {node.metadata.name}
        </span>
      </div>
    </div>
  );
};

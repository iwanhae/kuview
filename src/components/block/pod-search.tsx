import type { PodObject } from "@/lib/kuview";
import { useState, useMemo, useEffect } from "react";
import {
  podStatus,
  Status,
  STATUS_COLORS,
  OVERVIEW_STATUS_ORDER,
} from "@/lib/status";

interface PodSearchProps {
  pods: PodObject[];
  onPodSelect?: (podName: string) => void;
  selectedPodNN?: string;
}

export default function PodSearch({
  pods,
  onPodSelect,
  selectedPodNN,
}: PodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const itemsPerPage = 100;

  // Pods filtered by text search query (name or label)
  const podsMatchingSearchQuery = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (!trimmedSearchQuery) {
      return pods;
    }
    return pods.filter((pod) => {
      const nameMatch = `${pod.metadata.namespace}/${pod.metadata.name}`
        .toLowerCase()
        .includes(trimmedSearchQuery);
      const labelMatch = Object.values(pod.metadata.labels || {}).some(
        (labelValue) =>
          String(labelValue).toLowerCase().includes(trimmedSearchQuery),
      );
      return nameMatch || labelMatch;
    });
  }, [pods, searchQuery]);

  // Calculate counts for each status based on podsMatchingSearchQuery
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = OVERVIEW_STATUS_ORDER.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<Status, number>,
    );
    podsMatchingSearchQuery.forEach((pod) => {
      const status = podStatus(pod);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  }, [podsMatchingSearchQuery]);

  // Filter pods based on selected statuses
  const filteredPods = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return podsMatchingSearchQuery;
    }
    return podsMatchingSearchQuery.filter((pod) =>
      selectedStatuses.includes(podStatus(pod)),
    );
  }, [podsMatchingSearchQuery, selectedStatuses]);

  // Calculate pods for the current page
  const paginatedPods = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPods.slice(startIndex, endIndex);
  }, [filteredPods, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPods.length / itemsPerPage);

  const handlePodSelectInternal = (podName: string) => {
    const params = new URLSearchParams(window.location.search);
    if (podName) {
      params.set("pod", podName);
    } else {
      params.delete("pod");
    }
    history.pushState(null, "", `?${params.toString()}`);
    if (podName !== searchQuery) {
      setSearchQuery(podName);
    }
  };

  // Get pod NN from URL, and set it as the search query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const podNNFromUrl = params.get("pod");
    if (podNNFromUrl) {
      setSearchQuery(podNNFromUrl);
    }

    const podFilterFromUrl = params.get("podFilter");
    if (podFilterFromUrl) {
      const statuses = podFilterFromUrl.split(",") as Status[];
      setSelectedStatuses(
        statuses.filter((s) => OVERVIEW_STATUS_ORDER.includes(s)),
      );
    }
  }, []); // Removed onPodSelect from dependencies

  // If the search query is a pod NN, select the pod
  useEffect(() => {
    if (
      pods.find(
        (pod) =>
          `${pod.metadata.namespace}/${pod.metadata.name}` === searchQuery,
      )
    ) {
      onPodSelect?.(searchQuery);
    } else {
      onPodSelect?.("");
    }
  }, [searchQuery, pods, onPodSelect]);

  // If the selected statuses change, update the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedStatuses.length > 0) {
      params.set("podFilter", selectedStatuses.join(","));
    } else {
      params.delete("podFilter");
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
          placeholder="Search pods by name..."
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
          Showing {paginatedPods.length} of {filteredPods.length} pods
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

      {/* Pod List */}
      {filteredPods.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? "No pods match your search." : "No pods to display."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden h-[200px] overflow-y-auto">
          {paginatedPods.map((pod) => (
            <Row
              key={`${pod.metadata.namespace}/${pod.metadata.name}`}
              pod={pod}
              podCurrentStatus={podStatus(pod)}
              selectedPodNN={selectedPodNN}
              onPodSelect={handlePodSelectInternal}
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
  pod: PodObject;
  podCurrentStatus: Status;
  selectedPodNN?: string;
  onPodSelect?: (podName: string) => void;
}

const Row = ({
  pod,
  podCurrentStatus,
  selectedPodNN,
  onPodSelect,
}: RowProps) => {
  const isSelected =
    selectedPodNN === `${pod.metadata.namespace}/${pod.metadata.name}`;
  const statusColor = STATUS_COLORS[podCurrentStatus]?.color || "bg-gray-500";

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
      }`}
      onClick={() =>
        onPodSelect?.(
          isSelected ? "" : `${pod.metadata.namespace}/${pod.metadata.name}`,
        )
      }
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
          {pod.metadata.namespace}/{pod.metadata.name}
        </span>
      </div>
    </div>
  );
};

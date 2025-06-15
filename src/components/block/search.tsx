// import type { KubeObject } from "@/lib/kuview"; // Assuming a base KubeObject type - removed this line
import { useState, useMemo, useEffect } from "react";
import {
  Status,
  STATUS_COLORS,
  OVERVIEW_STATUS_ORDER,
  type Condition,
} from "@/lib/status";
import { useSearch } from "wouter";

// Define a more specific KubeObject if needed, or use a generic constraint
// For now, using a structural type that matches Kubernetes metadata
interface BaseKubeObject {
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string | undefined>;
  };
}

interface SearchComponentProps<T extends BaseKubeObject> {
  resources: T[];
  getResourceId: (resource: T) => string;
  getResourceStatus: (resource: T) => Condition;
  onResourceSelect?: (resourceId: string) => void;
  selectedResourceId?: string;
  resourceTypeName: string; // e.g., "node", "pod"
  urlResourceParam: string; // e.g., "node", "pod"
  urlFilterParam: string; // e.g., "nodeFilter", "podFilter"
}

export default function SearchComponent<T extends BaseKubeObject>(
  props: SearchComponentProps<T>,
) {
  const {
    resources,
    getResourceId,
    getResourceStatus,
    onResourceSelect,
    selectedResourceId,
    resourceTypeName,
    urlResourceParam,
    urlFilterParam,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const itemsPerPage = 100;
  const paramString = useSearch();

  // Resources filtered by text search query (ID or label)
  const resourcesMatchingSearchQuery = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (!trimmedSearchQuery) {
      return resources;
    }
    return resources.filter((resource) => {
      const idMatch = getResourceId(resource)
        .toLowerCase()
        .includes(trimmedSearchQuery);
      const labelMatch = Object.values(resource.metadata.labels || {}).some(
        (labelValue) =>
          String(labelValue).toLowerCase().includes(trimmedSearchQuery),
      );
      return idMatch || labelMatch;
    });
  }, [resources, searchQuery, getResourceId]);

  // Calculate counts for each status based on resourcesMatchingSearchQuery
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = OVERVIEW_STATUS_ORDER.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<Status, number>,
    );
    resourcesMatchingSearchQuery.forEach((resource) => {
      const status = getResourceStatus(resource).status;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  }, [resourcesMatchingSearchQuery, getResourceStatus]);

  // Filter resources based on selected statuses
  const filteredResources = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return resourcesMatchingSearchQuery;
    }
    return resourcesMatchingSearchQuery.filter((resource) =>
      selectedStatuses.includes(getResourceStatus(resource).status),
    );
  }, [resourcesMatchingSearchQuery, selectedStatuses, getResourceStatus]);

  // Calculate resources for the current page
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResources.slice(startIndex, endIndex);
  }, [filteredResources, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  const handleResourceSelectInternal = (resourceId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (resourceId) {
      params.set(urlResourceParam, resourceId);
    } else {
      params.delete(urlResourceParam);
    }
    history.pushState(null, "", `?${params.toString()}`);
    onResourceSelect?.(resourceId);
  };

  // Get resource filter from URL, and set it as the selected statuses
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterFromUrl = params.get(urlFilterParam);
    if (filterFromUrl) {
      const statuses = filterFromUrl.split(",") as Status[];
      setSelectedStatuses(
        statuses.filter((s) => OVERVIEW_STATUS_ORDER.includes(s)),
      );
    }
  }, [urlFilterParam]);

  // Handle URL resource selection independently from search query
  useEffect(() => {
    const params = new URLSearchParams(paramString);
    const resourceIdFromUrl = params.get(urlResourceParam);
    if (
      resourceIdFromUrl &&
      resources.find((res) => getResourceId(res) === resourceIdFromUrl)
    ) {
      onResourceSelect?.(resourceIdFromUrl);
    }
  }, [
    urlResourceParam,
    resources,
    onResourceSelect,
    getResourceId,
    paramString,
  ]);

  // Pagination
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
    <div className="space-y-4 w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${resourceTypeName}s by name/id...`}
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
          Showing {paginatedResources.length} of {filteredResources.length}{" "}
          {resourceTypeName}s{searchQuery && ` matching "${searchQuery}"`}
          {selectedStatuses.length > 0 && ` (filtered by status)`}
        </div>
        <div className="flex items-center space-x-2">
          {OVERVIEW_STATUS_ORDER.map((status) => {
            const count = statusCounts[status];
            if (count === 0 && !selectedStatuses.includes(status)) return null;
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
                <span
                  className={
                    STATUS_COLORS[status]?.textColor || "text-gray-700"
                  }
                >
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

      {/* Resource List */}
      {filteredResources.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            {searchQuery
              ? `No ${resourceTypeName}s match your search.`
              : `No ${resourceTypeName}s to display.`}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden h-[50vh] overflow-y-auto">
          {paginatedResources.map((resource) => (
            <Row
              key={getResourceId(resource)}
              resource={resource}
              resourceCurrentStatus={getResourceStatus(resource)}
              selectedResourceId={selectedResourceId}
              onResourceSelect={handleResourceSelectInternal}
              getResourceId={getResourceId}
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

interface RowProps<T extends BaseKubeObject> {
  resource: T;
  resourceCurrentStatus: Condition;
  selectedResourceId?: string;
  onResourceSelect?: (resourceId: string) => void;
  getResourceId: (resource: T) => string;
}

const Row = <T extends BaseKubeObject>({
  resource,
  resourceCurrentStatus,
  selectedResourceId,
  onResourceSelect,
  getResourceId,
}: RowProps<T>) => {
  const resourceId = getResourceId(resource);
  const isSelected = selectedResourceId === resourceId;
  const statusColor =
    STATUS_COLORS[resourceCurrentStatus.status]?.color || "bg-gray-500";

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
      }`}
      onClick={() => onResourceSelect?.(isSelected ? "" : resourceId)}
    >
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 animate-pulse ${statusColor}`}
        />
        <div className="flex flex-col">
          <span
            className={`text-sm font-mono ${
              isSelected ? "text-blue-700 font-medium" : "text-gray-900"
            }`}
          >
            {resourceId}
          </span>
          <span className="text-xs text-gray-500">
            {resourceCurrentStatus.reason}
          </span>
        </div>
      </div>
    </div>
  );
};

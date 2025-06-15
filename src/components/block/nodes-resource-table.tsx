import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject, NodeMetricsObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { getStatus, Status } from "@/lib/status";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./status-badge";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { PREFIX } from "@/lib/const";
import {
  RefreshCw,
  Cpu,
  MemoryStick,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import dayjs from "dayjs";

interface NodeResourceData {
  node: NodeObject;
  podCount: number;
  cpu: {
    capacity: number;
    requests: number;
    limits: number;
    usage?: number;
    requestsPercentage: number;
    limitsPercentage: number;
    usagePercentage?: number;
  };
  memory: {
    capacity: number;
    requests: number;
    limits: number;
    usage?: number;
    requestsPercentage: number;
    limitsPercentage: number;
    usagePercentage?: number;
  };
  status: Status;
}

function calculateNodeResourceData(
  nodes: Record<string, NodeObject>,
  pods: Record<string, PodObject>,
  nodeMetrics: Record<string, NodeMetricsObject>,
): NodeResourceData[] {
  const nodeResourceMap: Record<string, NodeResourceData> = {};

  // Initialize resource data for each node
  Object.values(nodes).forEach((node) => {
    const capacity = node.status.capacity || {};
    const cpuCapacity = parseCpu(capacity.cpu || "0");
    const memoryCapacity = parseMemory(capacity.memory || "0");

    nodeResourceMap[node.metadata.name] = {
      node,
      podCount: 0,
      cpu: {
        capacity: cpuCapacity,
        requests: 0,
        limits: 0,
        usage: 0,
        requestsPercentage: 0,
        limitsPercentage: 0,
        usagePercentage: 0,
      },
      memory: {
        capacity: memoryCapacity,
        requests: 0,
        limits: 0,
        usage: 0,
        requestsPercentage: 0,
        limitsPercentage: 0,
        usagePercentage: 0,
      },
      status: getStatus(node).status,
    };
  });

  // Iterate over pods to aggregate resource requests and limits
  Object.values(pods)
    .filter((pod) => pod.kuviewExtra?.status === "Running")
    .forEach((pod) => {
      const nodeName = pod.spec.nodeName;
      if (nodeName && nodeResourceMap[nodeName]) {
        const nodeData = nodeResourceMap[nodeName];
        nodeData.podCount += 1;

        pod.spec.containers.forEach((container) => {
          const resources = container.resources || {};
          if (resources.requests) {
            nodeData.cpu.requests += parseCpu(resources.requests.cpu || "0");
            nodeData.memory.requests += parseMemory(
              resources.requests.memory || "0",
            );
          }
          if (resources.limits) {
            nodeData.cpu.limits += parseCpu(resources.limits.cpu || "0");
            nodeData.memory.limits += parseMemory(
              resources.limits.memory || "0",
            );
          }
        });
      }
    });

  // Iterate over node metrics to aggregate actual usage (O(N) time)
  Object.values(nodeMetrics).forEach((nodeMetric) => {
    const nodeName = nodeMetric.metadata.name;
    if (nodeName && nodeResourceMap[nodeName]) {
      const nodeData = nodeResourceMap[nodeName];
      nodeData.cpu.usage = parseCpu(nodeMetric.usage.cpu || "0");
      nodeData.memory.usage = parseMemory(nodeMetric.usage.memory || "0");
    }
  });

  // Calculate percentages and handle undefined usage
  return Object.values(nodeResourceMap).map((nodeData) => {
    const { cpu, memory } = nodeData;

    cpu.requestsPercentage =
      cpu.capacity > 0 ? (cpu.requests / cpu.capacity) * 100 : 0;
    cpu.limitsPercentage =
      cpu.capacity > 0 ? (cpu.limits / cpu.capacity) * 100 : 0;

    memory.requestsPercentage =
      memory.capacity > 0 ? (memory.requests / memory.capacity) * 100 : 0;
    memory.limitsPercentage =
      memory.capacity > 0 ? (memory.limits / memory.capacity) * 100 : 0;

    // Set usage to undefined if no metrics available, otherwise calculate percentage
    if (cpu.usage === 0) {
      cpu.usage = undefined;
      cpu.usagePercentage = undefined;
    } else {
      cpu.usagePercentage =
        cpu.capacity > 0 ? (cpu.usage! / cpu.capacity) * 100 : 0;
    }

    if (memory.usage === 0) {
      memory.usage = undefined;
      memory.usagePercentage = undefined;
    } else {
      memory.usagePercentage =
        memory.capacity > 0 ? (memory.usage! / memory.capacity) * 100 : 0;
    }

    return nodeData;
  });
}

interface ResourceDisplayCellProps {
  usage?: number;
  requests: number;
  limits: number;
  capacity: number;
  formatValue: (value: number) => string;
}

function CustomProgressBar({
  percentage,
  colorClass,
  className = "",
}: {
  percentage: number;
  colorClass: string;
  className?: string;
}) {
  return (
    <div
      className={`h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1 ${className}`}
    >
      <div
        className={`h-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
      />
    </div>
  );
}

function ResourceDisplayCell({
  usage,
  requests,
  limits,
  capacity,
  formatValue,
}: ResourceDisplayCellProps) {
  const usagePercentage =
    usage !== undefined && capacity > 0 ? (usage / capacity) * 100 : 0;
  const requestsPercentage = capacity > 0 ? (requests / capacity) * 100 : 0;
  const limitsPercentage = capacity > 0 ? (limits / capacity) * 100 : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return "bg-red-500";
    if (percentage > 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRequestsColor = (percentage: number) => {
    if (percentage > 70) return "bg-blue-500";
    if (percentage > 40) return "bg-blue-400";
    return "bg-blue-300";
  };

  const getLimitsColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    return "bg-blue-600";
  };

  return (
    <div className="space-y-2 min-w-[140px]">
      {/* Usage */}
      {usage !== undefined && usage > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-red-700">Use</span>
            <span className="text-xs text-red-600 font-mono">
              {formatValue(usage)}
            </span>
            <CustomProgressBar
              percentage={usagePercentage}
              colorClass={getUsageColor(usagePercentage)}
            />
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]">
              {usagePercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Requests */}
      {requests > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-blue-700">Req</span>
            <span className="text-xs text-blue-600 font-mono">
              {formatValue(requests)}
            </span>
            <CustomProgressBar
              percentage={requestsPercentage}
              colorClass={getRequestsColor(requestsPercentage)}
            />
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]">
              {requestsPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Limits */}
      {limits > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-purple-700">Limit</span>
            <span className="text-xs text-purple-600 font-mono">
              {formatValue(limits)}
            </span>
            <CustomProgressBar
              percentage={limitsPercentage}
              colorClass={getLimitsColor(limitsPercentage)}
            />
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]">
              {limitsPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* No data */}
      {usage === undefined && requests === 0 && limits === 0 && (
        <div className="flex items-center justify-center h-12">
          <span className="text-xs text-muted-foreground">No data</span>
        </div>
      )}
    </div>
  );
}

type SortField = "name" | "status" | "pods" | "cpu" | "memory";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

function SortableHeader({
  children,
  field,
  currentSort,
  onSort,
  className = "",
}: {
  children: React.ReactNode;
  field: SortField;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort.field === field;

  return (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 transition-colors ${
              isActive && currentSort.direction === "asc"
                ? "text-primary"
                : "text-muted-foreground/30"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 transition-colors ${
              isActive && currentSort.direction === "desc"
                ? "text-primary"
                : "text-muted-foreground/30"
            }`}
          />
        </div>
      </div>
    </TableHead>
  );
}

export default function NodesResourceTable() {
  const rawNodes = useKuview("v1/Node");
  const rawPods = useKuview("v1/Pod");
  const rawNodeMetrics = useKuview("metrics.k8s.io/v1beta1/NodeMetrics");

  // Passive mode is used to prevent the table from recalculating when the data is too big to calculate every time.
  const [passiveMode, setPassiveMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    field: "pods",
    direction: "desc",
  });
  const [, setLocation] = useLocation();

  // State to hold nodes, pods, and pod metrics data for calculation, updated manually
  const [dataForCalculation, setDataForCalculation] = useState({
    nodes: rawNodes,
    pods: rawPods,
    nodeMetrics: rawNodeMetrics,
  });

  useEffect(() => {
    if (passiveMode) return;
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      nodeMetrics: rawNodeMetrics,
    });
  }, [rawNodes, rawPods, rawNodeMetrics, passiveMode]);

  const handleRefresh = () => {
    setDataForCalculation({
      nodes: rawNodes,
      pods: rawPods,
      nodeMetrics: rawNodeMetrics,
    });
  };

  const handleSort = (field: SortField) => {
    setSortState((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const nodeResourceData = useMemo(() => {
    const since = dayjs();
    const result = calculateNodeResourceData(
      dataForCalculation.nodes,
      dataForCalculation.pods,
      dataForCalculation.nodeMetrics,
    );
    const diff = Math.abs(since.diff());

    // if diff is bigger than 16ms, it means it takes more than 1 frame to calculate.
    if (diff > 16) {
      setPassiveMode(true);
      console.log(
        "[REACT] Passive mode activated due to slow calculation",
        diff,
      );
    }
    return result;
  }, [dataForCalculation, setPassiveMode]);

  // Sort and filter data
  const sortedAndFilteredData = useMemo(() => {
    const filtered = nodeResourceData.filter((data) =>
      data.node.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const sorted = filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortState.field) {
        case "name":
          aValue = a.node.metadata.name;
          bValue = b.node.metadata.name;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "pods":
          aValue = a.podCount;
          bValue = b.podCount;
          break;
        case "cpu":
          // Sort by usage first, then by limits if usage is not available
          aValue = a.cpu.usage ?? a.cpu.limits;
          bValue = b.cpu.usage ?? b.cpu.limits;
          break;
        case "memory":
          // Sort by usage first, then by limits if usage is not available
          aValue = a.memory.usage ?? a.memory.limits;
          bValue = b.memory.usage ?? b.memory.limits;
          break;
        default:
          aValue = a.podCount;
          bValue = b.podCount;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortState.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return sortState.direction === "asc" ? numA - numB : numB - numA;
      }
    });

    return sorted.slice(0, 5); // Limit to 5 entries
  }, [nodeResourceData, searchTerm, sortState]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
          <Input
            type="search"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          {passiveMode && (
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[325px] overflow-y-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                field="name"
                currentSort={sortState}
                onSort={handleSort}
              >
                Node
              </SortableHeader>
              <SortableHeader
                field="status"
                currentSort={sortState}
                onSort={handleSort}
              >
                Status
              </SortableHeader>
              <SortableHeader
                field="pods"
                currentSort={sortState}
                onSort={handleSort}
                className="text-center"
              >
                Pods
              </SortableHeader>
              <SortableHeader
                field="cpu"
                currentSort={sortState}
                onSort={handleSort}
              >
                <Cpu className="w-4 h-4" />
                CPU
              </SortableHeader>
              <SortableHeader
                field="memory"
                currentSort={sortState}
                onSort={handleSort}
              >
                <MemoryStick className="w-4 h-4" />
                Memory
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto max-h-[300px]">
            {sortedAndFilteredData.map((data) => (
              <TableRow
                key={data.node.metadata.name}
                onClick={() =>
                  setLocation(`${PREFIX}/nodes?node=${data.node.metadata.name}`)
                }
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  {data.node.metadata.name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={data.status} />
                </TableCell>
                <TableCell className="text-center">{data.podCount}</TableCell>
                <TableCell className="py-3">
                  <ResourceDisplayCell
                    usage={data.cpu.usage}
                    requests={data.cpu.requests}
                    limits={data.cpu.limits}
                    capacity={data.cpu.capacity}
                    formatValue={formatCpu}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <ResourceDisplayCell
                    usage={data.memory.usage}
                    requests={data.memory.requests}
                    limits={data.memory.limits}
                    capacity={data.memory.capacity}
                    formatValue={formatBytes}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

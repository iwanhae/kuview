import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
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
import ResourceCell from "./resource-cell";
import StatusBadge from "./status-badge";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { PREFIX } from "@/lib/const";
import { RefreshCw } from "lucide-react";

interface NodeResourceData {
  node: NodeObject;
  podCount: number;
  cpu: {
    capacity: number;
    requests: number;
    limits: number;
    requestsPercentage: number;
    limitsPercentage: number;
  };
  memory: {
    capacity: number;
    requests: number;
    limits: number;
    requestsPercentage: number;
    limitsPercentage: number;
  };
  status: Status;
}

function calculateNodeResourceData(
  nodes: Record<string, NodeObject>,
  pods: Record<string, PodObject>,
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
        requestsPercentage: 0,
        limitsPercentage: 0,
      },
      memory: {
        capacity: memoryCapacity,
        requests: 0,
        limits: 0,
        requestsPercentage: 0,
        limitsPercentage: 0,
      },
      status: getStatus(node).status,
    };
  });

  // Iterate over pods once to aggregate resource usage
  Object.values(pods).forEach((pod) => {
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
          nodeData.memory.limits += parseMemory(resources.limits.memory || "0");
        }
      });
    }
  });

  // Calculate percentages
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
    return nodeData;
  });
}

export default function NodesResourceTable() {
  const rawNodes = useKuview("v1/Node");
  const rawPods = useKuview("v1/Pod");
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // State to hold nodes and pods data for calculation, updated manually
  const [dataForCalculation, setDataForCalculation] = useState({
    nodes: rawNodes,
    pods: rawPods,
  });

  // Update dataForCalculation when rawNodes or rawPods change for the initial load.
  // This useEffect will run once on mount and whenever rawNodes/rawPods references change.
  // Subsequent updates will only happen via the refresh button.
  useEffect(() => {
    setDataForCalculation({ nodes: rawNodes, pods: rawPods });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setDataForCalculation({ nodes: rawNodes, pods: rawPods });
  };

  const nodeResourceData = useMemo(
    () => {
      console.log(
        "[REACT] Recalculating nodeResourceData due to dataForCalculation update",
        new Date().toLocaleTimeString(),
      );
      return calculateNodeResourceData(
        dataForCalculation.nodes,
        dataForCalculation.pods,
      );
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(dataForCalculation.nodes)
        .map(
          (n) =>
            `${n.metadata.name}_${n.status.capacity?.cpu}_${n.status.capacity?.memory}`,
        )
        .join(","),
      dataForCalculation.pods,
    ],
  );

  // Sort by highest pod count, then by CPU usage (limits percentage)
  const sortedAndFilteredData = useMemo(() => {
    const filtered = nodeResourceData.filter((data) =>
      data.node.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return filtered
      .sort((a, b) => {
        // Primary sort: podCount descending
        if (b.podCount !== a.podCount) {
          return b.podCount - a.podCount;
        }
        // Secondary sort: CPU limitsPercentage descending (optional, but good for tie-breaking)
        return b.cpu.limitsPercentage - a.cpu.limitsPercentage;
      })
      .slice(0, 5); // Limit to 5 entries as per user's prior change
  }, [nodeResourceData, searchTerm]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
          <Input
            type="search"
            placeholder="Nodes Resource Usage"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Node</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pods</TableHead>
              <TableHead>CPU Requests</TableHead>
              <TableHead>CPU Limits</TableHead>
              <TableHead>Memory Requests</TableHead>
              <TableHead>Memory Limits</TableHead>
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
                <TableCell>
                  <span className="font-medium">{data.podCount}</span>
                </TableCell>
                <TableCell>
                  <ResourceCell
                    used={data.cpu.requests}
                    capacity={data.cpu.capacity}
                    percentage={data.cpu.requestsPercentage}
                    formatValue={formatCpu}
                    type="requests"
                  />
                </TableCell>
                <TableCell>
                  <ResourceCell
                    used={data.cpu.limits}
                    capacity={data.cpu.capacity}
                    percentage={data.cpu.limitsPercentage}
                    formatValue={formatCpu}
                    type="limits"
                  />
                </TableCell>
                <TableCell>
                  <ResourceCell
                    used={data.memory.requests}
                    capacity={data.memory.capacity}
                    percentage={data.memory.requestsPercentage}
                    formatValue={formatBytes}
                    type="requests"
                  />
                </TableCell>
                <TableCell>
                  <ResourceCell
                    used={data.memory.limits}
                    capacity={data.memory.capacity}
                    percentage={data.memory.limitsPercentage}
                    formatValue={formatBytes}
                    type="limits"
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

import { useKuview } from "@/hooks/useKuview";
import type { NodeObject, PodObject } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { nodeStatus, Status } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return Object.values(nodes).map((node) => {
    const nodePods = Object.values(pods).filter(
      (pod) => pod.spec.nodeName === node.metadata.name,
    );

    const capacity = node.status.capacity || {};
    const cpuCapacity = parseCpu(capacity.cpu || "0");
    const memoryCapacity = parseMemory(capacity.memory || "0");

    let cpuRequests = 0;
    let cpuLimits = 0;
    let memoryRequests = 0;
    let memoryLimits = 0;

    nodePods.forEach((pod) => {
      pod.spec.containers.forEach((container) => {
        const resources = container.resources || {};

        if (resources.requests) {
          cpuRequests += parseCpu(resources.requests.cpu || "0");
          memoryRequests += parseMemory(resources.requests.memory || "0");
        }

        if (resources.limits) {
          cpuLimits += parseCpu(resources.limits.cpu || "0");
          memoryLimits += parseMemory(resources.limits.memory || "0");
        }
      });
    });

    return {
      node,
      podCount: nodePods.length,
      cpu: {
        capacity: cpuCapacity,
        requests: cpuRequests,
        limits: cpuLimits,
        requestsPercentage:
          cpuCapacity > 0 ? (cpuRequests / cpuCapacity) * 100 : 0,
        limitsPercentage: cpuCapacity > 0 ? (cpuLimits / cpuCapacity) * 100 : 0,
      },
      memory: {
        capacity: memoryCapacity,
        requests: memoryRequests,
        limits: memoryLimits,
        requestsPercentage:
          memoryCapacity > 0 ? (memoryRequests / memoryCapacity) * 100 : 0,
        limitsPercentage:
          memoryCapacity > 0 ? (memoryLimits / memoryCapacity) * 100 : 0,
      },
      status: nodeStatus(node),
    };
  });
}

export default function NodesResourceTable() {
  const nodes = useKuview("v1/Node");
  const pods = useKuview("v1/Pod");

  const nodeResourceData = calculateNodeResourceData(nodes, pods);

  // Sort by highest CPU usage (limits percentage)
  const sortedData = nodeResourceData.sort(
    (a, b) => b.cpu.limitsPercentage - a.cpu.limitsPercentage,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nodes Resource Usage</CardTitle>
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
          <TableBody>
            {sortedData.map((data) => (
              <TableRow key={data.node.metadata.name}>
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

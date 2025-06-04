import { useKuview } from "@/hooks/useKuview";
import useSWR from "swr";
import type { NodeObject, PodObject, ServiceObject, PodMetrics } from "@/lib/kuview";
import { parseCpu, parseMemory, formatCpu, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceBar from "./resource-bar"; // Assuming this can be reused
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error messages
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // For listing services

interface PodOverviewProps {
  pod: PodObject;
}

// Helper function to fetch data using the Fetch API.
// SWR will use this for data fetching.
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = res.statusText;
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
});

export default function PodOverview({ pod }: PodOverviewProps) {
  const { metadata, spec, status } = pod;
  const namespace = metadata.namespace || "default"; // Fallback to default if namespace is not present

  // 1. Fetch Node data
  const { data: nodeData, error: nodeError } = useSWR<NodeObject>(
    spec.nodeName ? `/api/kube/apis/v1/nodes/${spec.nodeName}` : null, // Kube API path for specific node
    fetcher
  );

  // 2. Fetch Services data
  const servicesData = useKuview("v1/Service");
  const podServices: ServiceObject[] = Object.values(servicesData).filter(service => {
    if (!service.spec.selector) return false;
    // Check if service selector matches pod labels
    return Object.entries(service.spec.selector).every(([key, value]) => {
      return metadata.labels && metadata.labels[key] === value;
    });
  });

  // 3. Fetch Pod Metrics
  const metricsUrl = `/api/kube/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods/${metadata.name}`;
  const { data: podMetrics, error: metricsError } = useSWR<PodMetrics>(
    metricsUrl,
    fetcher,
    {
      refreshInterval: 15000, // Cache for 15 seconds (SWR uses refreshInterval for this)
    }
  );

  // Calculate resource usage from metrics
  let cpuUsage = 0; // in millicores
  let memoryUsage = 0; // in bytes
  let cpuCapacity = 0; // in millicores, from node allocatable
  let memoryCapacity = 0; // in bytes, from node allocatable

  if (podMetrics && podMetrics.containers) {
    podMetrics.containers.forEach(container => {
      cpuUsage += parseCpu(container.usage.cpu || "0");
      memoryUsage += parseMemory(container.usage.memory || "0");
    });
  }

  if (nodeData && nodeData.status.allocatable) {
    cpuCapacity = parseCpu(nodeData.status.allocatable.cpu || "0");
    memoryCapacity = parseMemory(nodeData.status.allocatable.memory || "0");
  }


  return (
    <div className="space-y-4">
      {/* Node Status */}
      <Card>
        <CardHeader>
          <CardTitle>Node Information</CardTitle>
        </CardHeader>
        <CardContent>
          {nodeError && (
            <Alert variant="destructive">
              <AlertTitle>Error Fetching Node</AlertTitle>
              <AlertDescription>{nodeError.message || "Could not load node details."}</AlertDescription>
            </Alert>
          )}
          {nodeData ? (
            <div>
              <p><strong>Name:</strong> {nodeData.metadata.name}</p>
              <p><strong>Status:</strong> {nodeData.status.conditions?.find(c => c.type === "Ready")?.status || "Unknown"}</p>
              <p><strong>OS:</strong> {nodeData.status.nodeInfo?.osImage}</p>
              <p><strong>Kubelet Version:</strong> {nodeData.status.nodeInfo?.kubeletVersion}</p>
            </div>
          ) : spec.nodeName && !nodeError ? (
            <p>Loading node information...</p>
          ) : (
            <p>No node name specified in Pod spec.</p>
          )}
        </CardContent>
      </Card>

      {/* Pointing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          {podServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cluster IP</TableHead>
                  <TableHead>Ports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {podServices.map(service => (
                  <TableRow key={service.metadata.uid}>
                    <TableCell>{service.metadata.name}</TableCell>
                    <TableCell>{service.metadata.namespace}</TableCell>
                    <TableCell>{service.spec.type}</TableCell>
                    <TableCell>{service.spec.clusterIP || "N/A"}</TableCell>
                    <TableCell>{service.spec.ports?.map(p => `${p.port}:${p.targetPort || ""}(${p.protocol || "TCP"})`).join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No services point to this pod.</p>
          )}
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage (from Metrics Server)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {metricsError && (
            <Alert variant="destructive">
              <AlertTitle>Error Fetching Metrics</AlertTitle>
              <AlertDescription>{(metricsError as any).info || metricsError.message || "Could not load resource metrics."}</AlertDescription>
            </Alert>
          )}
          {!podMetrics && !metricsError && <p>Loading metrics...</p>}
          {podMetrics && (
            <>
              <ResourceBar
                title="CPU"
                requests={cpuUsage} // Displaying current usage as 'requests' for now
                // limits={0} // Limits are not directly available from PodMetrics
                capacity={cpuCapacity} // Node's capacity for context
                formatValue={formatCpu}
                currentUsage={cpuUsage} // Pass current usage for the bar fill
              />
              <ResourceBar
                title="Memory"
                requests={memoryUsage} // Displaying current usage as 'requests'
                // limits={0}
                capacity={memoryCapacity} // Node's capacity for context
                formatValue={formatBytes}
                currentUsage={memoryUsage} // Pass current usage for the bar fill
              />
              <p className="text-xs text-muted-foreground">
                CPU and Memory usage reported by the Kubernetes Metrics Server. Window: {podMetrics.window}. Timestamp: {new Date(podMetrics.timestamp).toLocaleString()}.
                Capacity shown is the allocatable capacity of the node ({spec.nodeName || "N/A"}).
              </p>
            </>
          )}
           {!podMetrics && metricsError && <p>Could not load metrics. Ensure metrics-server is installed and running.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

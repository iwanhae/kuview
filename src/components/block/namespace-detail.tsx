import type { NamespaceObject } from "@/lib/kuview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MetadataComponent from "./metadata";
import PodsGrid from "./pods-grid";
import ServicesGrid from "./services-grid";
import { cn } from "@/lib/utils";
import { useKuview } from "@/hooks/useKuview";
import { namespaceStatus, podStatus, serviceStatus } from "@/lib/status";
import { getStatusColor } from "@/lib/status";
import { Badge } from "@/components/ui/badge";

interface NamespaceDetailProps {
  namespace: NamespaceObject;
  className?: string;
}

export default function NamespaceDetail({
  namespace,
  className,
}: NamespaceDetailProps) {
  const pods = useKuview("v1/Pod");
  const services = useKuview("v1/Service");
  const endpointSlices = useKuview("discovery.k8s.io/v1/EndpointSlice");
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // Filter resources belonging to this namespace
  const namespacePods = Object.values(pods).filter(
    (pod) => pod.metadata.namespace === namespace.metadata.name,
  );

  const namespaceServices = Object.values(services).filter(
    (service) => service.metadata.namespace === namespace.metadata.name,
  );

  const endpointSlicesList = Object.values(endpointSlices);

  // Calculate pod status distribution
  const podStatusCounts = namespacePods.reduce(
    (acc, pod) => {
      const status = podStatus(pod).status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate service status distribution
  const serviceStatusCounts = namespaceServices.reduce(
    (acc, service) => {
      const status = serviceStatus(service, endpointSlicesList).status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{namespace.metadata.name}</h2>
        <p className="text-sm text-muted-foreground">
          Namespace • Created{" "}
          {new Date(namespace.metadata.creationTimestamp).toLocaleDateString()}
        </p>
      </div>

      {/* Status */}
      {(() => {
        const condition = namespaceStatus(namespace);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full ${getStatusColor(condition.status)}`}
            />
            <div className="text-sm text-muted-foreground">
              {condition.reason}
            </div>
          </div>
        );
      })()}

      {/* Resource Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Pods</div>
              <div className="text-2xl font-bold">{namespacePods.length}</div>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(podStatusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Services</div>
              <div className="text-2xl font-bold">
                {namespaceServices.length}
              </div>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(serviceStatusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Namespace Spec */}
      <Card>
        <CardHeader>
          <CardTitle>Namespace Spec</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Phase:</span>
              <span className="ml-2">{namespace.status.phase}</span>
            </div>
            {namespace.spec.finalizers &&
              namespace.spec.finalizers.length > 0 && (
                <div>
                  <span className="font-medium">Finalizers:</span>
                  <div className="ml-2 space-y-1">
                    {namespace.spec.finalizers.map((finalizer, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs mr-1"
                      >
                        {finalizer}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Pods Grid */}
      <PodsGrid
        title={`Pods in "${namespace.metadata.name}"`}
        pods={namespacePods}
      />

      {/* Services Grid */}
      <ServicesGrid
        title={`Services in "${namespace.metadata.name}"`}
        services={namespaceServices}
      />

      {/* Metadata Section */}
      <MetadataComponent metadata={namespace.metadata} />

      {/* JSON Original */}
      <Card>
        <Collapsible open={jsonExpanded} onOpenChange={setJsonExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle>JSON Original</CardTitle>
                <span className="text-xs">{jsonExpanded ? "▼" : "▶"}</span>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96 font-mono">
                {JSON.stringify(namespace, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

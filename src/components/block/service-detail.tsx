import type { ServiceObject } from "@/lib/kuview";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MetadataComponent from "./metadata";
import { cn } from "@/lib/utils";
import { useKuview } from "@/hooks/useKuview";
import { serviceStatus, getStatusColor } from "@/lib/status";
import ServiceSpecComponent from "./service-spec";
import ServiceStatusComponent from "./service-status";
import PodsGrid from "./pods-grid";

interface ServiceDetailProps {
  service: ServiceObject;
  className?: string;
}

export default function ServiceDetail({
  service,
  className,
}: ServiceDetailProps) {
  const pods = useKuview("v1/Pod");
  const endpointSlices = useKuview("discovery.k8s.io/v1/EndpointSlice");
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const endpointSlicesList = Object.values(endpointSlices);

  const serviceSelector = service.spec.selector;
  const targetPods = serviceSelector
    ? Object.values(pods).filter((pod) => {
        if (pod.metadata.namespace !== service.metadata.namespace) {
          return false;
        }
        const podLabels = pod.metadata.labels || {};
        return Object.entries(serviceSelector).every(
          ([key, value]) => podLabels[key] === value,
        );
      })
    : [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{service.metadata.name}</h2>
        <p className="text-sm text-muted-foreground">
          {service.metadata.namespace ? `${service.metadata.namespace}/` : ""}
          {service.metadata.name}
        </p>
      </div>

      {/* Status */}
      {(() => {
        const condition = serviceStatus(service, endpointSlicesList);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 ${getStatusColor(condition.status)}`} />
            <div className="text-sm text-muted-foreground">
              {condition.reason}
            </div>
          </div>
        );
      })()}

      {/* Target Pods */}
      {targetPods.length > 0 && (
        <PodsGrid title="Target Pods" pods={targetPods} />
      )}

      {/* Metadata Section */}
      <MetadataComponent metadata={service.metadata} />

      {/* Spec Section */}
      <ServiceSpecComponent spec={service.spec} />

      {/* Status Section */}
      <ServiceStatusComponent status={service.status} />

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
                {JSON.stringify(service, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

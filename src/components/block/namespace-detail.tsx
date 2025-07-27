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
import NamespaceSpecComponent from "./namespace-spec";
import MetadataHeader from "./metadata-header";

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
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // Filter resources belonging to this namespace
  const namespacePods = Object.values(pods).filter(
    (pod) => pod.metadata.namespace === namespace.metadata.name,
  );

  const namespaceServices = Object.values(services).filter(
    (service) => service.metadata.namespace === namespace.metadata.name,
  );

  return (
    <div className={cn("space-y-6", className)}>
      <MetadataHeader object={namespace} />

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

      {/* Namespace Spec */}
      <NamespaceSpecComponent spec={namespace.spec} status={namespace.status} />

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

import type { ServiceObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ServiceSpec = ServiceObject["spec"];
type ServicePort = NonNullable<ServiceSpec["ports"]>[number];

interface ServiceSpecComponentProps {
  spec: ServiceSpec;
}

export default function ServiceSpecComponent({
  spec,
}: ServiceSpecComponentProps) {
  if (!spec) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Specification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Type</p>
            <p className="text-sm text-muted-foreground">
              {spec.type || "ClusterIP"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Cluster IP</p>
            <p className="text-sm text-muted-foreground">
              {spec.clusterIP || "None"}
            </p>
          </div>
          {spec.externalIPs && spec.externalIPs.length > 0 && (
            <div>
              <p className="text-sm font-medium">External IPs</p>
              <p className="text-sm text-muted-foreground">
                {spec.externalIPs.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Ports */}
        {spec.ports && spec.ports.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Ports</p>
            <div className="space-y-2">
              {spec.ports.map((port: ServicePort, index: number) => (
                <div key={index} className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {port.name && `${port.name}: `}
                    {port.port}
                    {port.targetPort &&
                      port.targetPort !== port.port &&
                      ` → ${port.targetPort}`}
                    /{port.protocol || "TCP"}
                  </span>
                  {port.nodePort && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      NodePort: {port.nodePort}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector */}
        {spec.selector && Object.keys(spec.selector).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Selector</p>
            <div className="space-y-1">
              {Object.entries(spec.selector).map(
                ([key, value]: [string, string]) => (
                  <div key={key} className="text-sm text-muted-foreground">
                    <span className="font-mono">
                      {key}={value}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

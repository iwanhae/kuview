import type { ServiceObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ServiceStatus = ServiceObject["status"];

interface ServiceStatusComponentProps {
  status: ServiceStatus;
}

export default function ServiceStatusComponent({
  status,
}: ServiceStatusComponentProps) {
  if (
    !status ||
    !status.loadBalancer?.ingress ||
    status.loadBalancer.ingress.length === 0
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Load Balancer Ingress</p>
          <div className="text-sm text-muted-foreground">
            {status.loadBalancer.ingress.map((ingress, index) => (
              <div key={index}>{ingress.ip || ingress.hostname}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

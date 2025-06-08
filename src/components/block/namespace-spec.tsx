import type { NamespaceObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NamespaceSpec = NamespaceObject["spec"];
type NamespaceStatus = NamespaceObject["status"];

interface NamespaceSpecComponentProps {
  spec: NamespaceSpec;
  status: NamespaceStatus;
}

export default function NamespaceSpecComponent({
  spec,
  status,
}: NamespaceSpecComponentProps) {
  if (!spec || !status) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Namespace Spec & Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Phase:</span>
            <span className="ml-2">{status.phase}</span>
          </div>
          {spec.finalizers && spec.finalizers.length > 0 && (
            <div>
              <span className="font-medium">Finalizers:</span>
              <div className="ml-2 space-y-1">
                {spec.finalizers.map((finalizer: string, index: number) => (
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
  );
}

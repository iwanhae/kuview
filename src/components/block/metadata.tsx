import type { Metadata } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetadataProps {
  metadata: Metadata;
}

export default function MetadataComponent({ metadata }: MetadataProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-sm">{metadata.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Namespace
            </label>
            <p className="text-sm">{metadata.namespace || "default"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              UID
            </label>
            <p className="text-sm font-mono text-xs">{metadata.uid}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Resource Version
            </label>
            <p className="text-sm">{metadata.resourceVersion}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Creation Time
            </label>
            <p className="text-sm">
              {new Date(metadata.creationTimestamp).toLocaleString()}
            </p>
          </div>
          {metadata.deletionTimestamp && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Deletion Time
              </label>
              <p className="text-sm text-destructive">
                {new Date(metadata.deletionTimestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {metadata.labels && Object.keys(metadata.labels).length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Labels
            </label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(metadata.labels).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}={value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {metadata.annotations &&
          Object.keys(metadata.annotations).length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Annotations
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto bg-muted rounded p-2">
                {Object.entries(metadata.annotations).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="font-mono text-muted-foreground">
                      {key}:
                    </span>{" "}
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {metadata.ownerReferences && metadata.ownerReferences.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Owner References
            </label>
            <div className="space-y-2">
              {metadata.ownerReferences.map((owner, index) => (
                <div key={index} className="border rounded p-3 bg-muted/50">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Kind:</strong> {owner.kind}
                    </div>
                    <div>
                      <strong>Name:</strong> {owner.name}
                    </div>
                    <div>
                      <strong>API Version:</strong> {owner.apiVersion}
                    </div>
                    <div>
                      <strong>UID:</strong>{" "}
                      <span className="font-mono">{owner.uid}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Metadata from "./metadata";
import type { PersistentVolumeClaimObject } from "@/lib/kuview";
import { formatBytes } from "@/lib/utils";
import { Status } from "@/lib/status";
import MetadataHeader from "./metadata-header";

interface PVCDetailProps {
  pvc: PersistentVolumeClaimObject;
  className?: string;
}

export default function PVCDetail({ pvc, className }: PVCDetailProps) {
  const getStatusColor = (phase?: string): Status => {
    switch (phase) {
      case "Bound":
        return Status.Running;
      case "Pending":
        return Status.Pending;
      case "Lost":
        return Status.Error;
      default:
        return Status.Pending;
    }
  };

  const getStorageRequest = () => {
    return pvc.spec.resources?.requests?.storage;
  };

  const getStorageCapacity = () => {
    return pvc.status?.capacity?.storage;
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <MetadataHeader object={pvc} />

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Phase
                </p>
                <Badge
                  variant={
                    getStatusColor(pvc.status?.phase) === Status.Running
                      ? "default"
                      : "secondary"
                  }
                >
                  {pvc.status?.phase || "Unknown"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volume
                </p>
                <p className="text-sm font-mono">
                  {pvc.spec.volumeName || "Not bound"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Requested Storage
                </p>
                <p className="text-sm">
                  {getStorageRequest()
                    ? formatBytes(getStorageRequest()!)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Allocated Storage
                </p>
                <p className="text-sm">
                  {getStorageCapacity()
                    ? formatBytes(getStorageCapacity()!)
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specification */}
        <Card>
          <CardHeader>
            <CardTitle>Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Class
                </p>
                <p className="text-sm">
                  {pvc.spec.storageClassName || "Default"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volume Mode
                </p>
                <Badge variant="outline">
                  {pvc.spec.volumeMode || "Filesystem"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Access Modes
              </p>
              <div className="flex gap-2 flex-wrap mt-1">
                {pvc.spec.accessModes?.map((mode) => (
                  <Badge key={mode} variant="outline" className="text-xs">
                    {mode}
                  </Badge>
                )) || (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>
            {pvc.spec.selector && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Selector
                </p>
                <div className="mt-1">
                  {pvc.spec.selector.matchLabels &&
                    Object.keys(pvc.spec.selector.matchLabels).length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Match Labels:
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(pvc.spec.selector.matchLabels).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="text-xs"
                              >
                                {key}={value}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  {pvc.spec.selector.matchExpressions &&
                    pvc.spec.selector.matchExpressions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Match Expressions:
                        </p>
                        <div className="space-y-1">
                          {pvc.spec.selector.matchExpressions.map(
                            (expr, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {expr.key} {expr.operator}{" "}
                                {expr.values?.join(", ")}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Requirements */}
        {pvc.spec.resources && (
          <Card>
            <CardHeader>
              <CardTitle>Resource Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pvc.spec.resources.requests && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Requests
                    </p>
                    <div className="space-y-1">
                      {Object.entries(pvc.spec.resources.requests).map(
                        ([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-mono">{key}:</span>{" "}
                            {key === "storage" ? formatBytes(value) : value}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {pvc.spec.resources.limits && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Limits
                    </p>
                    <div className="space-y-1">
                      {Object.entries(pvc.spec.resources.limits).map(
                        ([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-mono">{key}:</span>{" "}
                            {key === "storage" ? formatBytes(value) : value}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conditions */}
        {pvc.status?.conditions && pvc.status.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pvc.status.conditions.map((condition, index) => (
                  <div key={index} className="border rounded p-3 bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Type
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {condition.type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Status
                        </p>
                        <Badge
                          variant={
                            condition.status === "True"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {condition.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Last Transition
                        </p>
                        <p className="text-xs">
                          {condition.lastTransitionTime
                            ? new Date(
                                condition.lastTransitionTime,
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {condition.reason && (
                      <div className="mb-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Reason
                        </p>
                        <p className="text-xs">{condition.reason}</p>
                      </div>
                    )}
                    {condition.message && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Message
                        </p>
                        <p className="text-xs">{condition.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Metadata metadata={pvc.metadata} />
      </div>
    </div>
  );
}

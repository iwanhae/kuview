import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Metadata from "./metadata";
import type { PersistentVolumeObject } from "@/lib/kuview";
import { formatBytes } from "@/lib/utils";
import { Status } from "@/lib/status";
import MetadataHeader from "./metadata-header";

interface PVDetailProps {
  pv: PersistentVolumeObject;
  className?: string;
}

export default function PVDetail({ pv, className }: PVDetailProps) {
  const getStatusColor = (phase?: string): Status => {
    switch (phase) {
      case "Available":
        return Status.Running;
      case "Bound":
        return Status.Running;
      case "Pending":
        return Status.Pending;
      case "Released":
        return Status.Warning;
      case "Failed":
        return Status.Error;
      default:
        return Status.Pending;
    }
  };

  const getVolumeSource = (spec: PersistentVolumeObject["spec"]) => {
    if (spec.hostPath) return "HostPath";
    if (spec.nfs) return "NFS";
    if (spec.csi) return "CSI";
    return "Unknown";
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <MetadataHeader object={pv} />

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
                    getStatusColor(pv.status?.phase) === Status.Running
                      ? "default"
                      : "secondary"
                  }
                >
                  {pv.status?.phase || "Unknown"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reclaim Policy
                </p>
                <Badge variant="outline">
                  {pv.spec.persistentVolumeReclaimPolicy || "Retain"}
                </Badge>
              </div>
            </div>
            {pv.status?.message && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Message
                </p>
                <p className="text-sm">{pv.status.message}</p>
              </div>
            )}
            {pv.status?.reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reason
                </p>
                <p className="text-sm">{pv.status.reason}</p>
              </div>
            )}
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
                  Capacity
                </p>
                <p className="text-sm">
                  {pv.spec.capacity?.storage
                    ? formatBytes(pv.spec.capacity.storage)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volume Mode
                </p>
                <Badge variant="outline">
                  {pv.spec.volumeMode || "Filesystem"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Class
                </p>
                <p className="text-sm">{pv.spec.storageClassName || "None"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volume Source
                </p>
                <Badge variant="outline">{getVolumeSource(pv.spec)}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Access Modes
              </p>
              <div className="flex gap-2 flex-wrap mt-1">
                {pv.spec.accessModes?.map((mode) => (
                  <Badge key={mode} variant="outline" className="text-xs">
                    {mode}
                  </Badge>
                )) || (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume Source Details */}
        {pv.spec.csi && (
          <Card>
            <CardHeader>
              <CardTitle>CSI Volume Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Driver
                  </p>
                  <p className="text-sm font-mono">{pv.spec.csi.driver}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Volume Handle
                  </p>
                  <p className="text-sm font-mono text-wrap break-all">
                    {pv.spec.csi.volumeHandle}
                  </p>
                </div>
                {pv.spec.csi.fsType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      FS Type
                    </p>
                    <p className="text-sm">{pv.spec.csi.fsType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Read Only
                  </p>
                  <Badge
                    variant={pv.spec.csi.readOnly ? "secondary" : "outline"}
                  >
                    {pv.spec.csi.readOnly ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pv.spec.hostPath && (
          <Card>
            <CardHeader>
              <CardTitle>HostPath Volume Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Path
                  </p>
                  <p className="text-sm font-mono">{pv.spec.hostPath.path}</p>
                </div>
                {pv.spec.hostPath.type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Type
                    </p>
                    <Badge variant="outline">{pv.spec.hostPath.type}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {pv.spec.nfs && (
          <Card>
            <CardHeader>
              <CardTitle>NFS Volume Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Server
                  </p>
                  <p className="text-sm font-mono">{pv.spec.nfs.server}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Path
                  </p>
                  <p className="text-sm font-mono">{pv.spec.nfs.path}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Read Only
                  </p>
                  <Badge
                    variant={pv.spec.nfs.readOnly ? "secondary" : "outline"}
                  >
                    {pv.spec.nfs.readOnly ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Metadata metadata={pv.metadata} />
      </div>
    </div>
  );
}

import type { PodObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface PodSpecProps {
  spec: PodObject["spec"];
}

export default function PodSpecComponent({ spec }: PodSpecProps) {
  const [containersExpanded, setContainersExpanded] = useState(true);
  const [volumesExpanded, setVolumesExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spec</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          {spec.nodeName && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Node Name
              </label>
              <p className="text-sm">{spec.nodeName}</p>
            </div>
          )}
          {spec.restartPolicy && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Restart Policy
              </label>
              <p className="text-sm">{spec.restartPolicy}</p>
            </div>
          )}
          {spec.serviceAccountName && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Service Account
              </label>
              <p className="text-sm">{spec.serviceAccountName}</p>
            </div>
          )}
          {spec.schedulerName && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Scheduler
              </label>
              <p className="text-sm">{spec.schedulerName}</p>
            </div>
          )}
        </div>

        {/* Containers */}
        <Collapsible
          open={containersExpanded}
          onOpenChange={setContainersExpanded}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
            <h4 className="text-sm font-medium">
              Containers ({spec.containers.length})
            </h4>
            <span className="text-xs">{containersExpanded ? "▼" : "▶"}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {spec.containers.map((container, index) => (
              <div key={index} className="border rounded p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{container.name}</h5>
                  <Badge variant="outline" className="text-xs">
                    {container.image}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {container.imagePullPolicy && (
                    <div>
                      <span className="text-muted-foreground">
                        Pull Policy:
                      </span>{" "}
                      {container.imagePullPolicy}
                    </div>
                  )}
                  {container.args && container.args.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Args:</span>
                      <div className="mt-1 space-y-1">
                        {container.args.map((arg, argIndex) => (
                          <div
                            key={argIndex}
                            className="font-mono bg-muted p-1 rounded text-xs"
                          >
                            {arg}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Environment Variables */}
                {container.env && container.env.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      Environment Variables:
                    </span>
                    <div className="mt-1 space-y-1">
                      {container.env.map((envVar, envIndex) => (
                        <div
                          key={envIndex}
                          className="text-xs bg-muted p-1 rounded"
                        >
                          <span className="font-mono">{envVar.name}</span>
                          {envVar.value && <span> = {envVar.value}</span>}
                          {envVar.valueFrom && (
                            <span className="text-muted-foreground">
                              {" "}
                              (from{" "}
                              {envVar.valueFrom.fieldRef
                                ? `field: ${envVar.valueFrom.fieldRef.fieldPath}`
                                : envVar.valueFrom.configMapKeyRef
                                  ? `configMap: ${envVar.valueFrom.configMapKeyRef.name}`
                                  : envVar.valueFrom.secretKeyRef
                                    ? `secret: ${envVar.valueFrom.secretKeyRef.name}`
                                    : "valueFrom"}
                              )
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ports */}
                {container.ports && container.ports.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      Ports:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {container.ports.map((port, portIndex) => (
                        <Badge
                          key={portIndex}
                          variant="secondary"
                          className="text-xs"
                        >
                          {port.name ? `${port.name}:` : ""}
                          {port.containerPort}/{port.protocol || "TCP"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volume Mounts */}
                {container.volumeMounts &&
                  container.volumeMounts.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        Volume Mounts:
                      </span>
                      <div className="mt-1 space-y-1">
                        {container.volumeMounts.map((mount, mountIndex) => (
                          <div
                            key={mountIndex}
                            className="text-xs bg-muted p-1 rounded"
                          >
                            <span className="font-mono">{mount.name}</span> →{" "}
                            {mount.mountPath}
                            {mount.readOnly && (
                              <span className="text-muted-foreground">
                                {" "}
                                (ro)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Volumes */}
        {spec.volumes && spec.volumes.length > 0 && (
          <Collapsible open={volumesExpanded} onOpenChange={setVolumesExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Volumes ({spec.volumes.length})
              </h4>
              <span className="text-xs">{volumesExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {spec.volumes.map((volume, index) => (
                <div key={index} className="border rounded p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{volume.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {volume.persistentVolumeClaim
                        ? "PVC"
                        : volume.hostPath
                          ? "HostPath"
                          : volume.configMap
                            ? "ConfigMap"
                            : volume.secret
                              ? "Secret"
                              : volume.emptyDir
                                ? "EmptyDir"
                                : "Other"}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1">
                    {volume.persistentVolumeClaim && (
                      <div>PVC: {volume.persistentVolumeClaim.claimName}</div>
                    )}
                    {volume.hostPath && (
                      <div>Host Path: {volume.hostPath.path}</div>
                    )}
                    {volume.configMap && (
                      <div>ConfigMap: {volume.configMap.name}</div>
                    )}
                    {volume.secret && (
                      <div>Secret: {volume.secret.secretName}</div>
                    )}
                    {volume.emptyDir && (
                      <div>
                        EmptyDir
                        {volume.emptyDir.medium &&
                          ` (${volume.emptyDir.medium})`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tolerations */}
        {spec.tolerations && spec.tolerations.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Tolerations
            </label>
            <div className="space-y-1">
              {spec.tolerations.map((toleration, index) => (
                <div key={index} className="text-xs bg-muted p-2 rounded">
                  {toleration.key && (
                    <span className="font-mono">{toleration.key}</span>
                  )}
                  {toleration.operator && <span> {toleration.operator}</span>}
                  {toleration.value && <span> {toleration.value}</span>}
                  {toleration.effect && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({toleration.effect})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

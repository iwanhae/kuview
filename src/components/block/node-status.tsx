import type { NodeObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { formatBytes } from "@/lib/utils";

interface NodeStatusProps {
  status: NodeObject["status"];
}

const getConditionStatusColor = (status: string) => {
  switch (status) {
    case "True":
      return "bg-green-100 text-green-800";
    case "False":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function NodeStatusComponent({ status }: NodeStatusProps) {
  const [conditionsExpanded, setConditionsExpanded] = useState(true);
  const [addressesExpanded, setAddressesExpanded] = useState(false);
  const [imagesExpanded, setImagesExpanded] = useState(false);
  const [systemInfoExpanded, setSystemInfoExpanded] = useState(false);
  const [volumesExpanded, setVolumesExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Status */}
        <div className="grid grid-cols-2 gap-4">
          {status.phase && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Phase
              </label>
              <p className="text-sm">{status.phase}</p>
            </div>
          )}
        </div>

        {/* Resource Capacity & Allocatable */}
        {(status.capacity || status.allocatable) && (
          <div className="grid grid-cols-2 gap-4">
            {status.capacity && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Capacity
                </label>
                <div className="space-y-1 text-xs bg-muted p-2 rounded">
                  {Object.entries(status.capacity).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {key.includes("memory") || key.includes("storage")
                          ? formatBytes(value)
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {status.allocatable && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Allocatable
                </label>
                <div className="space-y-1 text-xs bg-muted p-2 rounded">
                  {Object.entries(status.allocatable).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {key.includes("memory") || key.includes("storage")
                          ? formatBytes(value)
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conditions */}
        {status.conditions && status.conditions.length > 0 && (
          <Collapsible
            open={conditionsExpanded}
            onOpenChange={setConditionsExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Conditions ({status.conditions.length})
              </h4>
              <span className="text-xs">{conditionsExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {status.conditions.map((condition, index) => (
                <div key={index} className="border rounded p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {condition.type}
                    </span>
                    <Badge
                      className={getConditionStatusColor(condition.status)}
                      variant="outline"
                    >
                      {condition.status}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">
                        Last Transition:
                      </span>{" "}
                      {new Date(condition.lastTransitionTime).toLocaleString()}
                    </div>
                    {condition.lastHeartbeatTime && (
                      <div>
                        <span className="text-muted-foreground">
                          Last Heartbeat:
                        </span>{" "}
                        {new Date(condition.lastHeartbeatTime).toLocaleString()}
                      </div>
                    )}
                    {condition.reason && (
                      <div>
                        <span className="text-muted-foreground">Reason:</span>{" "}
                        {condition.reason}
                      </div>
                    )}
                    {condition.message && (
                      <div>
                        <span className="text-muted-foreground">Message:</span>{" "}
                        {condition.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Addresses */}
        {status.addresses && status.addresses.length > 0 && (
          <Collapsible
            open={addressesExpanded}
            onOpenChange={setAddressesExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Addresses ({status.addresses.length})
              </h4>
              <span className="text-xs">{addressesExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {status.addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                >
                  <span className="text-sm font-medium">{address.type}</span>
                  <span className="text-sm font-mono">{address.address}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* System Info */}
        {status.nodeInfo && (
          <Collapsible
            open={systemInfoExpanded}
            onOpenChange={setSystemInfoExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">System Info</h4>
              <span className="text-xs">{systemInfoExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Architecture:</span>{" "}
                  {status.nodeInfo.architecture}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Operating System:
                  </span>{" "}
                  {status.nodeInfo.operatingSystem}
                </div>
                <div>
                  <span className="text-muted-foreground">OS Image:</span>{" "}
                  {status.nodeInfo.osImage}
                </div>
                <div>
                  <span className="text-muted-foreground">Kernel Version:</span>{" "}
                  {status.nodeInfo.kernelVersion}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Kubelet Version:
                  </span>{" "}
                  {status.nodeInfo.kubeletVersion}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Kube-Proxy Version:
                  </span>{" "}
                  {status.nodeInfo.kubeProxyVersion}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Container Runtime:
                  </span>{" "}
                  {status.nodeInfo.containerRuntimeVersion}
                </div>
                <div>
                  <span className="text-muted-foreground">Machine ID:</span>
                  <span className="font-mono text-xs break-all">
                    {status.nodeInfo.machineID}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">System UUID:</span>
                  <span className="font-mono text-xs break-all">
                    {status.nodeInfo.systemUUID}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Boot ID:</span>
                  <span className="font-mono text-xs break-all">
                    {status.nodeInfo.bootID}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Volumes */}
        {((status.volumesInUse && status.volumesInUse.length > 0) ||
          (status.volumesAttached && status.volumesAttached.length > 0)) && (
          <Collapsible open={volumesExpanded} onOpenChange={setVolumesExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">Volumes</h4>
              <span className="text-xs">{volumesExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {status.volumesInUse && status.volumesInUse.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    In Use ({status.volumesInUse.length})
                  </label>
                  <div className="space-y-1">
                    {status.volumesInUse.map((volume, index) => (
                      <div
                        key={index}
                        className="text-xs bg-muted p-2 rounded font-mono"
                      >
                        {volume}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {status.volumesAttached && status.volumesAttached.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Attached ({status.volumesAttached.length})
                  </label>
                  <div className="space-y-1">
                    {status.volumesAttached.map((volume, index) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded">
                        <div>
                          <strong>Name:</strong> {volume.name}
                        </div>
                        <div>
                          <strong>Device Path:</strong>{" "}
                          <span className="font-mono">{volume.devicePath}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Container Images */}
        {status.images && status.images.length > 0 && (
          <Collapsible open={imagesExpanded} onOpenChange={setImagesExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Container Images ({status.images.length})
              </h4>
              <span className="text-xs">{imagesExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {status.images.map((image, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {image.names.map((name, nameIndex) => (
                          <div key={nameIndex} className="font-mono break-all">
                            {name}
                          </div>
                        ))}
                      </div>
                      {image.sizeBytes && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {formatBytes(image.sizeBytes)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Daemon Endpoints */}
        {status.daemonEndpoints && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Daemon Endpoints
            </label>
            <div className="text-xs bg-muted p-2 rounded">
              {status.daemonEndpoints.kubeletEndpoint && (
                <div>
                  <span className="text-muted-foreground">Kubelet Port:</span>{" "}
                  {status.daemonEndpoints.kubeletEndpoint.Port}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

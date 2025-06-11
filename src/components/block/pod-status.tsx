import type { PodObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import dayjs from "dayjs";

interface PodStatusProps {
  status: PodObject["status"];
}

const getStatusColor = (phase: string) => {
  switch (phase) {
    case "Running":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Succeeded":
      return "bg-blue-100 text-blue-800";
    case "Failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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

const getContainerStateColor = (state: {
  running?: unknown;
  waiting?: unknown;
  terminated?: unknown;
}) => {
  if (state?.running) return "bg-green-100 text-green-800";
  if (state?.waiting) return "bg-yellow-100 text-yellow-800";
  if (state?.terminated) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

export default function PodStatusComponent({ status }: PodStatusProps) {
  const [containersExpanded, setContainersExpanded] = useState(true);
  const [conditionsExpanded, setConditionsExpanded] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Phase
            </label>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(status.phase)}>
                {status.phase}
              </Badge>
            </div>
          </div>
          {status.qosClass && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                QoS Class
              </label>
              <p className="text-sm">{status.qosClass}</p>
            </div>
          )}
          {status.hostIP && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Host IP
              </label>
              <p className="text-sm font-mono">{status.hostIP}</p>
            </div>
          )}
          {status.podIP && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Pod IP
              </label>
              <p className="text-sm font-mono">{status.podIP}</p>
            </div>
          )}
          {status.startTime && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Start Time
              </label>
              <p className="text-sm">
                {new Date(status.startTime).toLocaleString()}
              </p>
            </div>
          )}
          {status.nominatedNodeName && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nominated Node
              </label>
              <p className="text-sm">{status.nominatedNodeName}</p>
            </div>
          )}
        </div>

        {status.message && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Message
            </label>
            <p className="text-sm bg-muted p-2 rounded">{status.message}</p>
          </div>
        )}

        {status.reason && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Reason
            </label>
            <p className="text-sm">{status.reason}</p>
          </div>
        )}

        {/* Pod IPs */}
        {status.podIPs && status.podIPs.length > 1 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Pod IPs
            </label>
            <div className="flex flex-wrap gap-1">
              {status.podIPs.map((podIP, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {podIP.ip}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Container Statuses */}
        {status.containerStatuses && status.containerStatuses.length > 0 && (
          <Collapsible
            open={containersExpanded}
            onOpenChange={setContainersExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Container Statuses ({status.containerStatuses.length})
              </h4>
              <span className="text-xs">{containersExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              {status.containerStatuses.map((container, index) => (
                <div key={index} className="border rounded p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">{container.name}</h5>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={container.ready ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {container.ready ? "Ready" : "Not Ready"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Restarts: {container.restartCount}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Image:</span>{" "}
                      {container.image}
                    </div>
                    {container.imageID && (
                      <div>
                        <span className="text-muted-foreground">Image ID:</span>
                        <span className="font-mono text-xs break-all">
                          {container.imageID}
                        </span>
                      </div>
                    )}
                    {container.containerID && (
                      <div>
                        <span className="text-muted-foreground">
                          Container ID:
                        </span>
                        <span className="font-mono text-xs break-all">
                          {container.containerID}
                        </span>
                      </div>
                    )}
                    {container.started !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Started:</span>{" "}
                        {container.started ? "Yes" : "No"}
                      </div>
                    )}
                  </div>

                  {/* Current State */}
                  {container.state && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        Current State:
                      </span>
                      <div className="mt-1">
                        {container.state.running && (
                          <Badge
                            className={getContainerStateColor(container.state)}
                            variant="outline"
                          >
                            Running since{" "}
                            {container.state.running.startedAt
                              ? new Date(
                                  container.state.running.startedAt,
                                ).toLocaleString()
                              : "unknown"}
                          </Badge>
                        )}
                        {container.state.waiting && (
                          <div className="space-y-1">
                            <Badge
                              className={getContainerStateColor(
                                container.state,
                              )}
                              variant="outline"
                            >
                              Waiting:{" "}
                              {container.state.waiting.reason || "Unknown"}
                            </Badge>
                            {container.state.waiting.message && (
                              <div className="text-xs bg-muted p-1 rounded">
                                {container.state.waiting.message}
                              </div>
                            )}
                          </div>
                        )}
                        {container.state.terminated && (
                          <div className="space-y-1">
                            <Badge
                              className={getContainerStateColor(
                                container.state,
                              )}
                              variant="outline"
                            >
                              Terminated:{" "}
                              {container.state.terminated.reason || "Unknown"}{" "}
                              (Exit: {container.state.terminated.exitCode})
                            </Badge>
                            {container.state.terminated.message && (
                              <div className="text-xs bg-muted p-1 rounded">
                                {container.state.terminated.message}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last State */}
                  {container.lastState && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        Last State:
                      </span>
                      <div className="mt-1">
                        {container.lastState.terminated && (
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Badge
                                variant="outline"
                                className={getContainerStateColor({
                                  terminated: true,
                                })}
                              >
                                Terminated:{` `}
                                {container.lastState.terminated.reason ||
                                  "Unknown"}{" "}
                                (Exit: {container.lastState.terminated.exitCode}
                                )
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-muted-foreground"
                              >
                                {[
                                  container.lastState.terminated.startedAt,
                                  container.lastState.terminated.finishedAt,
                                ]
                                  .filter((t) => t !== undefined)
                                  .map((t) =>
                                    dayjs(t).format("YYYY-MM-DDTHH:mm:ssZ"),
                                  )
                                  .join(" ~ ")}
                              </Badge>
                            </div>
                            {container.lastState.terminated.message && (
                              <div className="text-xs bg-muted p-1 rounded whitespace-pre-wrap">
                                {container.lastState.terminated.message}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
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
                    {condition.lastProbeTime && (
                      <div>
                        <span className="text-muted-foreground">
                          Last Probe:
                        </span>{" "}
                        {new Date(condition.lastProbeTime).toLocaleString()}
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
      </CardContent>
    </Card>
  );
}

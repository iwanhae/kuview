import type { NamespaceObject, NodeObject, PodObject } from "./kuview";
import dayjs from "dayjs";

export enum Status {
  Running = "Running",
  Done = "Done",
  Pending = "Pending",
  Warning = "Warning",
  Error = "Error",
  Terminating = "Terminating",
}

export const STATUS_COLORS = {
  [Status.Running]: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    severity: 1,
  },
  [Status.Done]: {
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    severity: 0,
  },
  [Status.Pending]: {
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    severity: 2,
  },
  [Status.Warning]: {
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    severity: 4,
  },
  [Status.Error]: {
    color: "bg-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    severity: 5,
  },
  [Status.Terminating]: {
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    severity: 3,
  },
} as const;

export const OVERVIEW_STATUS_ORDER: Status[] = [
  Status.Running,
  Status.Pending,
  Status.Terminating,
  Status.Done,
  Status.Warning,
  Status.Error,
];

export function nodeStatus(node: NodeObject) {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (node.metadata.deletionTimestamp) {
    return Status.Terminating;
  }

  // if node's condition with type "Ready" is not "True", return Error
  if (node.status.conditions?.some((condition) => condition.type === "Ready" && condition.status !== "True")) {
    return Status.Error;
  }

  // every condition other than "Ready" is not "False", return Warning
  if (node.status.conditions?.
    filter((condition) => condition.type !== "Ready").
    every((condition) => condition.status !== "False")) {
    return Status.Warning;
  }

  return Status.Running;
}

export function podStatus(pod: PodObject) {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (pod.metadata.deletionTimestamp) {
    return Status.Terminating;
  }

  // Done: if pod's phase is "Succeeded", return Done
  if (pod.status.phase === "Succeeded") {
    return Status.Done;
  }

  // Error - Done: if pod's phase is "Failed", return Error
  if (pod.status.phase === "Failed") {
    return Status.Error;
  }

  // Pending: if pod's phase is "Pending", return Pending 
  // and 
  //   creationTimestamp is less than 1 minutes, return Pending
  //   else 
  //   return Warning
  if (pod.status.phase === "Pending") {
    if (dayjs(pod.metadata.creationTimestamp).isAfter(dayjs().subtract(1, "minute"))) {
      return Status.Pending;
    } else {
      return Status.Warning;
    }
  }

  // Warning: if pod's status.containerStatuses's state.waiting.reason is "CrashLoopBackOff", return Warning
  if (pod.status.containerStatuses?.some(
    status => status.state.waiting?.reason === "CrashLoopBackOff"
  )) {
    return Status.Error;
  }

  // Warning: if some of pod's container statuses's lastState.terminated is not null
  // and it is less than 10 minutes ago, return Warning
  if (pod.status.containerStatuses?.
    some(status =>
      status.lastState?.terminated &&
      dayjs(status.lastState.terminated.finishedAt).
        isAfter(dayjs().subtract(10, "minute")))
  ) {
    return Status.Error;
  }

  // Error - Unknown: if pod's phase is "Unknown", return Error
  if (pod.status.phase === "Unknown") {
    return Status.Error;
  }

  return Status.Running;
}

export function namespaceStatus(namespace: NamespaceObject) {
  // Error: if namespace's status.phase is "Terminating"
  // and deletionTimestamp is more than 1 hour ago
  if (namespace.status.phase === "Terminating"
    && dayjs(namespace.metadata.deletionTimestamp).isBefore(dayjs().subtract(1, "hour"))) {
    return Status.Error;
  }

  // Terminating: if deletionTimestamp is not null, return Terminating
  if (namespace.metadata.deletionTimestamp) {
    return Status.Terminating;
  }

  return Status.Running;
}
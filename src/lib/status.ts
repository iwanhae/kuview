import type { NodeObject, PodObject } from "./kuview";
import dayjs from "dayjs";

export enum Status {
  Running = "Running",
  Done = "Done",
  Pending = "Pending",
  Warning = "Warning",
  Error = "Error",
  Terminating = "Terminating",
}

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
  // and creationTimestamp is less than 1 minutes, return Pending
  if (pod.status.phase === "Pending"
    && dayjs(pod.metadata.creationTimestamp).isAfter(dayjs().subtract(1, "minute"))) {
    return Status.Pending;
  }

  // Warning: if pod's every .status.conditions's status is not "True", return Warning
  if (pod.status.conditions?.every((condition) => condition.status !== "True")) {
    return Status.Warning;
  }

  // Error - Unknown: if pod's phase is "Unknown", return Error
  if (pod.status.phase === "Unknown") {
    return Status.Error;
  }

  return Status.Running;
}
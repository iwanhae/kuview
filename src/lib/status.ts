import type {
  NamespaceObject,
  NodeObject,
  PodObject,
  ServiceObject,
  PersistentVolumeObject,
  PersistentVolumeClaimObject,
  KubernetesObject,
  Endpoint,
} from "./kuview";
import dayjs from "dayjs";

export enum Status {
  Running = "Running",
  Done = "Done",
  Pending = "Pending",
  Warning = "Warning",
  Error = "Error",
  Terminating = "Terminating",
}

export const STATUS_ORDER = [
  Status.Error,
  Status.Warning,
  Status.Terminating,
  Status.Pending,
  Status.Running,
  Status.Done,
];

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

// getStatusColor returns the className combination of the status color and animation
// it is good for representing the status for single resource
export const getStatusColor = (status: Status) => {
  switch (status) {
    case Status.Running:
      return STATUS_COLORS.Running.color + " animate-pulse";
    case Status.Pending:
      return STATUS_COLORS.Pending.color;
    case Status.Error:
      return STATUS_COLORS.Error.color + " animate-bounce";
    case Status.Done:
      return STATUS_COLORS.Done.color;
    case Status.Warning:
      return STATUS_COLORS.Warning.color + " animate-caret-blink";
    case Status.Terminating:
      return STATUS_COLORS.Terminating.color + " animate-pulse";
    default:
      return STATUS_COLORS.Pending.color;
  }
};

export const OVERVIEW_STATUS_ORDER: Status[] = [
  Status.Running,
  Status.Pending,
  Status.Terminating,
  Status.Done,
  Status.Warning,
  Status.Error,
];

export interface Condition {
  status: Status;
  reason: string;
}

export function getStatus(object: KubernetesObject): Condition {
  return (
    object.kuviewExtra || {
      status: Status.Error,
      reason: "This is a bug. Need to fix it.",
    }
  );
}

export function calcStatus(object: KubernetesObject): Condition {
  const gvk = `${object.apiVersion}/${object.kind}`;
  switch (gvk) {
    case "v1/Pod":
      return podStatus(object as PodObject);
    case "v1/Node":
      return nodeStatus(object as NodeObject);
    case "v1/Namespace":
      return namespaceStatus(object as NamespaceObject);
    case "v1/Service":
      return serviceStatus(object as ServiceObject);
    case "v1/PersistentVolume":
      return persistentVolumeStatus(object as PersistentVolumeObject);
    case "v1/PersistentVolumeClaim":
      return persistentVolumeClaimStatus(object as PersistentVolumeClaimObject);
    default:
      return {
        status: Status.Pending,
        reason: "Unknown resource type",
      };
  }
}

function nodeStatus(node: NodeObject): Condition {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (node.metadata.deletionTimestamp) {
    return {
      status: Status.Terminating,
      reason: `Scheduled for deletion ${dayjs().diff(
        dayjs(node.metadata.deletionTimestamp),
        "second",
      )} seconds ago`,
    };
  }

  // if node's condition with type "Ready" is not "True", return Error
  const readyCondition = node.status.conditions?.find(
    (condition) => condition.type === "Ready",
  );
  if (readyCondition && readyCondition.status !== "True") {
    return {
      status: Status.Error,
      reason: `Node is not ready: ${readyCondition.reason || readyCondition.message || "Ready condition status is not True"}`,
    };
  }

  // every condition other than "Ready" is not "False", return Warning
  const nonReadyConditions = node.status.conditions?.filter(
    (condition) => condition.type !== "Ready",
  );
  const problemConditions = nonReadyConditions?.filter(
    (condition) => condition.status !== "False",
  );

  if (problemConditions && problemConditions.length > 0) {
    const conditionNames = problemConditions.map((c) => c.type).join(", ");
    return {
      status: Status.Warning,
      reason: `Node has concerning conditions: ${conditionNames}`,
    };
  }

  // Warning: if node is unschedulable
  if (node.spec.unschedulable) {
    return {
      status: Status.Warning,
      reason: `Node is unschedulable`,
    };
  }

  return {
    status: Status.Running,
    reason: `Node is ready and all conditions are healthy`,
  };
}

function podStatus(pod: PodObject): Condition {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (pod.metadata.deletionTimestamp) {
    return {
      status: Status.Terminating,
      reason: `Scheduled for deletion ${dayjs().diff(
        dayjs(pod.metadata.deletionTimestamp),
        "second",
      )} seconds ago`,
    };
  }

  // Done: if pod's phase is "Succeeded", return Done
  if (pod.status.phase === "Succeeded") {
    return {
      status: Status.Done,
      reason: `status.phase is "Succeeded"`,
    };
  }

  // Error - Done: if pod's phase is "Failed", return Error
  if (pod.status.phase === "Failed") {
    return {
      status: Status.Error,
      reason: `status.phase is "Failed"`,
    };
  }

  // Pending: if pod's phase is "Pending", return Pending
  // and
  //   creationTimestamp is less than 1 minutes, return Pending
  //   else
  //   return Warning
  if (pod.status.phase === "Pending") {
    if (
      dayjs(pod.metadata.creationTimestamp).isAfter(
        dayjs().subtract(1, "minute"),
      )
    ) {
      return {
        status: Status.Pending,
        reason: `status.phase is "Pending"`,
      };
    } else {
      return {
        status: Status.Warning,
        reason: `status.phase is in "Pending" state for ${dayjs().diff(
          dayjs(pod.metadata.creationTimestamp),
          "minute",
        )} minutes`,
      };
    }
  }

  // Error: if some of pod's container statuses's lastState.terminated is not null
  // and it is less than 10 minutes ago, return Error
  if (
    pod.status.containerStatuses?.some(
      (status) =>
        status.lastState?.terminated &&
        dayjs(status.lastState.terminated.finishedAt).isAfter(
          dayjs().subtract(10, "minute"),
        ),
    )
  ) {
    const container = pod.status.containerStatuses?.find(
      (status) => status.lastState?.terminated,
    );
    return {
      status: Status.Error,
      reason: `Container "${container?.name || container?.image}" is terminated ${dayjs().diff(
        dayjs(container?.lastState?.terminated?.finishedAt),
        "minute",
      )} minutes ago`,
    };
  }

  // Error: if pod's status.containerStatuses's state.waiting.reason is "CrashLoopBackOff", return Error
  if (
    pod.status.containerStatuses?.some(
      (status) => status.state?.waiting?.reason === "CrashLoopBackOff",
    )
  ) {
    return {
      status: Status.Error,
      reason: `Pod is in CrashLoopBackOff state`,
    };
  }

  // Error - Unknown: if pod's phase is "Unknown", return Error
  if (pod.status.phase === "Unknown") {
    return {
      status: Status.Error,
      reason: `status.phase is "Unknown"`,
    };
  }

  // Warning: Pod's condition with type "Ready" is not "True"
  const readyCondition = pod.status.conditions?.find(
    (condition) => condition.type === "Ready",
  );
  if (readyCondition && readyCondition.status !== "True") {
    return {
      status: Status.Warning,
      reason: `Pod is not ready: ${readyCondition.message || readyCondition.reason || "Ready condition status is not True"}`,
    };
  }

  return {
    status: Status.Running,
    reason: `status.phase is "Running"`,
  };
}

function namespaceStatus(namespace: NamespaceObject): Condition {
  // Error: if namespace's status.phase is "Terminating"
  // and deletionTimestamp is more than 1 hour ago
  if (
    namespace.status.phase === "Terminating" &&
    dayjs(namespace.metadata.deletionTimestamp).isBefore(
      dayjs().subtract(1, "hour"),
    )
  ) {
    const hoursStuck = dayjs().diff(
      dayjs(namespace.metadata.deletionTimestamp),
      "hour",
    );
    return {
      status: Status.Error,
      reason: `Namespace stuck in terminating state for ${hoursStuck} hours`,
    };
  }

  // Terminating: if deletionTimestamp is not null, return Terminating
  if (namespace.metadata.deletionTimestamp) {
    const minutesAgo = dayjs().diff(
      dayjs(namespace.metadata.deletionTimestamp),
      "minute",
    );
    return {
      status: Status.Terminating,
      reason: `Scheduled for deletion ${minutesAgo} minutes ago`,
    };
  }

  return {
    status: Status.Running,
    reason: `Namespace is active and healthy`,
  };
}

function serviceStatus(service: ServiceObject): Condition {
  const epss = Object.values(service.kuviewExtra?.endpointSlices || {});

  if (!epss) {
    // If service is ExternalName, return Running
    if (service.spec.type === "ExternalName") {
      return {
        status: Status.Running,
        reason: "ExternalName service is active",
      };
    }

    // else, return Error
    return {
      status: Status.Error,
      reason: "No EndpointSlices found for service",
    };
  }

  const endpoints = epss.reduce((acc, eps) => {
    return [...acc, ...(eps.endpoints || [])];
  }, [] as Endpoint[]);

  if (!endpoints) {
    return {
      status: Status.Error,
      reason: "No endpoints found for service",
    };
  }

  const readyEndpoints =
    endpoints.filter((endpoint) => endpoint?.conditions?.ready) || [];

  if (readyEndpoints.length === 0) {
    return {
      status: Status.Error,
      reason: "No ready endpoints available",
    };
  }

  if (readyEndpoints.length < endpoints.length) {
    return {
      status: Status.Warning,
      reason: `${readyEndpoints.length}/${endpoints.length} endpoints ready`,
    };
  }

  return {
    status: Status.Running,
    reason: `${readyEndpoints.length}/${endpoints.length} endpoints ready`,
  };
}

function persistentVolumeStatus(volume: PersistentVolumeObject): Condition {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (volume.metadata.deletionTimestamp) {
    return {
      status: Status.Terminating,
      reason: `Scheduled for deletion ${dayjs().diff(
        dayjs(volume.metadata.deletionTimestamp),
        "second",
      )} seconds ago`,
    };
  }

  switch (volume.status?.phase) {
    case "Available":
      return {
        status: Status.Running,
        reason: "Volume is available and ready for use",
      };
    case "Bound":
      return {
        status: Status.Running,
        reason: "Volume is bound to a claim",
      };
    case "Pending":
      return {
        status: Status.Pending,
        reason: "Volume is pending provisioning",
      };
    case "Released":
      return {
        status: Status.Warning,
        reason: "Volume is released but not available",
      };
    case "Failed":
      return {
        status: Status.Error,
        reason: volume.status?.message || "Volume is in failed state",
      };
    default:
      return {
        status: Status.Pending,
        reason: "Volume status is unknown",
      };
  }
}

function persistentVolumeClaimStatus(
  claim: PersistentVolumeClaimObject,
): Condition {
  // Terminating: if deletionTimestamp is not null, return Terminating
  if (claim.metadata.deletionTimestamp) {
    return {
      status: Status.Terminating,
      reason: `Scheduled for deletion ${dayjs().diff(
        dayjs(claim.metadata.deletionTimestamp),
        "second",
      )} seconds ago`,
    };
  }

  switch (claim.status?.phase) {
    case "Bound":
      return {
        status: Status.Running,
        reason: "Claim is bound to a volume",
      };
    case "Pending":
      // Check if pending for too long
      if (
        dayjs(claim.metadata.creationTimestamp).isBefore(
          dayjs().subtract(5, "minute"),
        )
      ) {
        return {
          status: Status.Warning,
          reason: `Claim has been pending for ${dayjs().diff(
            dayjs(claim.metadata.creationTimestamp),
            "minute",
          )} minutes`,
        };
      }
      return {
        status: Status.Pending,
        reason: "Claim is pending binding to a volume",
      };
    case "Lost":
      return {
        status: Status.Error,
        reason: "Claim has lost its bound volume",
      };
    default:
      return {
        status: Status.Pending,
        reason: "Claim status is unknown",
      };
  }
}

import type { KubernetesObject, Metadata, ResourceList } from "./types";

export interface NodeObject extends KubernetesObject {
  kind: "Node";
  apiVersion: "v1";
  metadata: Metadata;
  spec: NodeSpec;
  status: NodeStatus;
}

interface NodeSpec {
  podCIDR?: string;
  podCIDRs?: string[];
  unschedulable?: boolean;
  providerID?: string;
  taints?: NodeTaint[];
}

interface NodeTaint {
  key: string;
  value?: string;
  effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
  timeAdded?: string;
}

interface NodeStatus {
  conditions?: NodeCondition[];
  addresses?: NodeAddress[];
  allocatable?: ResourceList;
  capacity?: ResourceList;
  nodeInfo?: NodeSystemInfo;
  daemonEndpoints?: NodeDaemonEndpoints;
  images?: ContainerImage[];
  phase?: "Pending" | "Running" | "Terminated";
  volumesInUse?: string[];
  volumesAttached?: AttachedVolume[];
}

interface NodeSystemInfo {
  architecture: string;
  bootID: string;
  containerRuntimeVersion: string;
  kernelVersion: string;
  kubeProxyVersion: string;
  kubeletVersion: string;
  machineID: string;
  operatingSystem: string;
  osImage: string;
  systemUUID: string;
}

interface NodeDaemonEndpoints {
  kubeletEndpoint?: DaemonEndpoint;
}

interface DaemonEndpoint {
  Port: number;
}

interface ContainerImage {
  names: string[];
  sizeBytes?: number;
}

interface AttachedVolume {
  name: string;
  devicePath: string;
}

interface NodeCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  lastHeartbeatTime?: string;
  reason?: string;
  message?: string;
}

interface NodeAddress {
  type:
    | "InternalIP"
    | "ExternalIP"
    | "Hostname"
    | "InternalDNS"
    | "ExternalDNS";
  address: string;
}

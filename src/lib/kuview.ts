export type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
};

export interface KuviewObjectMap {
  "v1/Pod": PodObject;
  "v1/Service": ServiceObject;
  "v1/Node": NodeObject;
  "v1/Namespace": NamespaceObject;
}

export type GVK = keyof KuviewObjectMap;

export type KuviewObjectType<T extends GVK> = KuviewObjectMap[T];

export interface NamespaceObject extends KubernetesObject {
  kind: "Namespace"
  apiVersion: "v1"
  metadata: Metadata
  spec: NamespaceSpec
  status: NamespaceStatus
}

interface NamespaceSpec {
  finalizers?: string[]
}

interface NamespaceStatus {
  phase: string
}

export interface KubernetesObject {
  kind: string
  apiVersion: string
  metadata: Metadata
  finalizers?: string[]
  spec: unknown
  status: unknown
}

export interface Metadata {
  name: string
  uid: string
  resourceVersion: string
  creationTimestamp: string
  labels?: Labels
  annotations?: Annotations
  finalizers?: string[]
  namespace?: string
  deletionTimestamp?: string
}

export interface Labels {
  [key: string]: string | undefined
}

export interface Annotations {
  [key: string]: string | undefined
}

// Specific object types
export interface PodObject extends KubernetesObject {
  kind: "Pod"
  apiVersion: "v1"
  metadata: Metadata
  spec: PodSpec
  status: PodStatus
}

export interface ServiceObject extends KubernetesObject {
  kind: "Service"
  apiVersion: "v1"
  metadata: Metadata
  spec: ServiceSpec
  status: ServiceStatus
}

export interface NodeObject extends KubernetesObject {
  kind: "Node"
  apiVersion: "v1"
  metadata: Metadata
  spec: NodeSpec
  status: NodeStatus
}

// Specs and Status interfaces
interface PodSpec {
  nodeName: string
  containers: Container[]
}

interface Container {
  name: string
  resources: {
    requests: {
      memory: string
    }
  }
}

interface PodStatus {
  conditions?: PodCondition[]
  phase: string
  qosClass: "Guaranteed" | "Burstable" | "BestEffort"
}

interface PodCondition {
  type: string
  status: string
  lastTransitionTime: string
  lastProbeTime: string | null
}

interface ServiceSpec {
  type: string
  ports?: ServicePort[]
  selector?: Record<string, string>
}

interface ServiceStatus {
  loadBalancer?: {
    ingress?: Array<{ ip?: string; hostname?: string }>
  }
}

interface ServicePort {
  name?: string
  port: number
  targetPort?: number | string
  protocol?: string
}

interface NodeSpec {
  podCIDR?: string
  unschedulable?: boolean
}

interface NodeStatus {
  conditions?: NodeCondition[]
  addresses?: NodeAddress[]
}

interface NodeCondition {
  type: string
  status: string
  lastTransitionTime: string
  reason?: string
  message?: string
}

interface NodeAddress {
  type: string
  address: string
}


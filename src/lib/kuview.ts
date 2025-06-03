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
  kind: "Namespace";
  apiVersion: "v1";
  metadata: Metadata;
  spec: NamespaceSpec;
  status: NamespaceStatus;
}

interface NamespaceSpec {
  finalizers?: string[];
}

interface NamespaceStatus {
  phase: string;
}

export interface KubernetesObject {
  kind: string;
  apiVersion: string;
  metadata: Metadata;
  finalizers?: string[];
  spec: unknown;
  status: unknown;
}

export interface Metadata {
  name: string;
  uid: string;
  resourceVersion: string;
  creationTimestamp: string;
  labels?: Labels;
  annotations?: Annotations;
  finalizers?: string[];
  namespace?: string;
  deletionTimestamp?: string;
  generateName?: string;
  ownerReferences?: OwnerReference[];
}

export interface OwnerReference {
  apiVersion: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind: string;
  name: string;
  uid: string;
}

export interface Labels {
  [key: string]: string | undefined;
}

export interface Annotations {
  [key: string]: string | undefined;
}

// Specific object types
export interface PodObject extends KubernetesObject {
  kind: "Pod";
  apiVersion: "v1";
  metadata: Metadata;
  spec: PodSpec;
  status: PodStatus;
}

export interface ServiceObject extends KubernetesObject {
  kind: "Service";
  apiVersion: "v1";
  metadata: Metadata;
  spec: ServiceSpec;
  status: ServiceStatus;
}

export interface NodeObject extends KubernetesObject {
  kind: "Node";
  apiVersion: "v1";
  metadata: Metadata;
  spec: NodeSpec;
  status: NodeStatus;
}

// Specs and Status interfaces
interface PodSpec {
  containers: Container[];
  dnsPolicy?: string;
  enableServiceLinks?: boolean;
  hostname?: string;
  nodeName?: string;
  preemptionPolicy?: string;
  priority?: number;
  restartPolicy?: string;
  schedulerName?: string;
  securityContext?: SecurityContext;
  serviceAccount?: string;
  serviceAccountName?: string;
  subdomain?: string;
  terminationGracePeriodSeconds?: number;
  tolerations?: Toleration[];
  volumes?: Volume[];
}

interface Container {
  name: string;
  image: string;
  imagePullPolicy?: "Always" | "IfNotPresent" | "Never";
  env?: EnvVar[];
  ports?: ContainerPort[];
  resources?: ResourceRequirements;
  terminationMessagePath?: string;
  terminationMessagePolicy?: string;
  volumeMounts?: VolumeMount[];
  args?: string[];
}

interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
}

interface EnvVarSource {
  fieldRef?: ObjectFieldSelector;
  resourceFieldRef?: ResourceFieldSelector;
  configMapKeyRef?: ConfigMapKeySelector;
  secretKeyRef?: SecretKeySelector;
}

interface ObjectFieldSelector {
  apiVersion?: string;
  fieldPath: string;
}

interface ResourceFieldSelector {
  containerName?: string;
  resource: string;
  divisor?: string;
}

interface ConfigMapKeySelector {
  name?: string;
  key: string;
  optional?: boolean;
}

interface SecretKeySelector {
  name?: string;
  key: string;
  optional?: boolean;
}

interface ContainerPort {
  name?: string;
  containerPort: number;
  hostPort?: number;
  protocol?: "TCP" | "UDP" | "SCTP";
}

interface ResourceRequirements {
  limits?: ResourceList;
  requests?: ResourceList;
}

interface ResourceList {
  [key: string]: string;
}

interface VolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

interface SecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  fsGroup?: number;
  seccompProfile?: SeccompProfile;
  seLinuxOptions?: SELinuxOptions;
  supplementalGroups?: number[];
  sysctls?: Sysctl[];
  windowsOptions?: WindowsSecurityContextOptions;
}

interface SeccompProfile {
  type: string;
  localhostProfile?: string;
}

interface SELinuxOptions {
  level?: string;
  role?: string;
  type?: string;
  user?: string;
}

interface Sysctl {
  name: string;
  value: string;
}

interface WindowsSecurityContextOptions {
  gmsaCredentialName?: string;
  gmsaCredentialSpec?: string;
  hostProcess?: boolean;
  runAsUserName?: string;
}

interface Toleration {
  effect?: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
  key?: string;
  operator?: "Exists" | "Equal";
  tolerationSeconds?: number;
  value?: string;
}

interface Volume {
  name: string;
  persistentVolumeClaim?: PersistentVolumeClaimVolumeSource;
  hostPath?: HostPathVolumeSource;
  projected?: ProjectedVolumeSource;
  configMap?: ConfigMapVolumeSource;
  secret?: SecretVolumeSource;
  emptyDir?: EmptyDirVolumeSource;
}

interface PersistentVolumeClaimVolumeSource {
  claimName: string;
  readOnly?: boolean;
}

interface HostPathVolumeSource {
  path: string;
  type?: string;
}

interface ProjectedVolumeSource {
  defaultMode?: number;
  sources?: VolumeProjection[];
}

interface VolumeProjection {
  configMap?: ConfigMapProjection;
  downwardAPI?: DownwardAPIProjection;
  secret?: SecretProjection;
  serviceAccountToken?: ServiceAccountTokenProjection;
}

interface ConfigMapProjection {
  name?: string;
  items?: KeyToPath[];
  optional?: boolean;
}

interface DownwardAPIProjection {
  items?: DownwardAPIVolumeFile[];
}

interface SecretProjection {
  name?: string;
  items?: KeyToPath[];
  optional?: boolean;
}

interface ServiceAccountTokenProjection {
  audience?: string;
  expirationSeconds?: number;
  path: string;
}

interface KeyToPath {
  key: string;
  path: string;
  mode?: number;
}

interface DownwardAPIVolumeFile {
  fieldRef?: ObjectFieldSelector;
  mode?: number;
  path: string;
  resourceFieldRef?: ResourceFieldSelector;
}

interface ConfigMapVolumeSource {
  name?: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

interface SecretVolumeSource {
  secretName?: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

interface EmptyDirVolumeSource {
  medium?: string;
  sizeLimit?: string;
}

interface PodStatus {
  conditions?: PodCondition[];
  phase: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
  qosClass?: "Guaranteed" | "Burstable" | "BestEffort";
  containerStatuses?: ContainerStatus[];
  hostIP?: string;
  podIP?: string;
  podIPs?: PodIP[];
  startTime?: string;
  message?: string;
  reason?: string;
  nominatedNodeName?: string;
}

interface PodIP {
  ip: string;
}

interface ContainerStatus {
  containerID?: string;
  image: string;
  imageID: string;
  lastState?: ContainerState;
  name: string;
  ready: boolean;
  restartCount: number;
  started?: boolean;
  state?: ContainerState;
}

interface ContainerState {
  running?: ContainerStateRunning;
  waiting?: ContainerStateWaiting;
  terminated?: ContainerStateTerminated;
}

interface ContainerStateRunning {
  startedAt?: string;
}

interface ContainerStateWaiting {
  message?: string;
  reason?: string;
}

interface ContainerStateTerminated {
  containerID?: string;
  exitCode: number;
  finishedAt?: string;
  message?: string;
  reason?: string;
  signal?: number;
  startedAt?: string;
}

interface PodCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  lastProbeTime?: string | null;
  message?: string;
  reason?: string;
}

interface ServiceSpec {
  type: string;
  ports?: ServicePort[];
  selector?: Record<string, string>;
}

interface ServiceStatus {
  loadBalancer?: {
    ingress?: Array<{ ip?: string; hostname?: string }>;
  };
}

interface ServicePort {
  name?: string;
  port: number;
  targetPort?: number | string;
  protocol?: string;
}

interface NodeSpec {
  podCIDR?: string;
  unschedulable?: boolean;
}

interface NodeStatus {
  conditions?: NodeCondition[];
  addresses?: NodeAddress[];
}

interface NodeCondition {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason?: string;
  message?: string;
}

interface NodeAddress {
  type: string;
  address: string;
}

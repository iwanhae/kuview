import type {
  KubernetesObject,
  Metadata,
  ResourceList,
  KeyToPath,
} from "./types";

export interface PodObject extends KubernetesObject {
  kind: "Pod";
  apiVersion: "v1";
  metadata: Metadata;
  spec: PodSpec;
  status: PodStatus;
}

interface PodSpec {
  containers: Container[];
  initContainers?: Container[];
  ephemeralContainers?: Container[];
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

export interface Container {
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

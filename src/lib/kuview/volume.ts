import type {
  KubernetesObject,
  ResourceList,
  KeyToPath,
  LabelSelector,
  Metadata,
} from "./types";

// Core Volume Types (from Go types.go lines 36-49)
// Note: VolumeSource is inlined (json:",inline") so volume source fields appear directly on Volume
export interface Volume {
  name: string;
  // Volume source fields (inlined from VolumeSource)
  hostPath?: HostPathVolumeSource;
  emptyDir?: EmptyDirVolumeSource;
  secret?: SecretVolumeSource;
  persistentVolumeClaim?: PersistentVolumeClaimVolumeSource;
  configMap?: ConfigMapVolumeSource;
  ephemeral?: EphemeralVolumeSource;
  projected?: ProjectedVolumeSource;
  downwardAPI?: DownwardAPIVolumeSource;
  nfs?: NFSVolumeSource;
  csi?: CSIVolumeSource;
  // Add other volume source types as needed from VolumeSource
}

// VolumeSource represents the source of a volume to mount (from Go types.go lines 49-230)
export interface VolumeSource {
  hostPath?: HostPathVolumeSource;
  emptyDir?: EmptyDirVolumeSource;
  secret?: SecretVolumeSource;
  persistentVolumeClaim?: PersistentVolumeClaimVolumeSource;
  configMap?: ConfigMapVolumeSource;
  ephemeral?: EphemeralVolumeSource;
  projected?: ProjectedVolumeSource;
  downwardAPI?: DownwardAPIVolumeSource;
  nfs?: NFSVolumeSource;
  csi?: CSIVolumeSource;
  // Add other volume source types as needed
}

// PersistentVolumeClaimVolumeSource (from Go types.go lines 231-240)
export interface PersistentVolumeClaimVolumeSource {
  claimName: string;
  readOnly?: boolean;
}

// Volume Source Types
export interface HostPathVolumeSource {
  path: string;
  type?: HostPathType;
}

export type HostPathType =
  | ""
  | "DirectoryOrCreate"
  | "Directory"
  | "FileOrCreate"
  | "File"
  | "Socket"
  | "CharDevice"
  | "BlockDevice";

export interface EmptyDirVolumeSource {
  medium?: string;
  sizeLimit?: string;
}

export interface SecretVolumeSource {
  secretName?: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface ConfigMapVolumeSource {
  name?: string;
  defaultMode?: number;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface EphemeralVolumeSource {
  volumeClaimTemplate?: PersistentVolumeClaimTemplate;
}

export interface PersistentVolumeClaimTemplate {
  metadata?: Metadata;
  spec: PersistentVolumeClaimSpec;
}

export interface ProjectedVolumeSource {
  defaultMode?: number;
  sources?: VolumeProjection[];
}

export interface VolumeProjection {
  configMap?: ConfigMapProjection;
  downwardAPI?: DownwardAPIProjection;
  secret?: SecretProjection;
  serviceAccountToken?: ServiceAccountTokenProjection;
}

export interface ConfigMapProjection {
  name?: string;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface DownwardAPIProjection {
  items?: DownwardAPIVolumeFile[];
}

export interface SecretProjection {
  name?: string;
  items?: KeyToPath[];
  optional?: boolean;
}

export interface ServiceAccountTokenProjection {
  audience?: string;
  expirationSeconds?: number;
  path: string;
}

export interface DownwardAPIVolumeSource {
  items?: DownwardAPIVolumeFile[];
  defaultMode?: number;
}

export interface DownwardAPIVolumeFile {
  path: string;
  fieldRef?: ObjectFieldSelector;
  resourceFieldRef?: ResourceFieldSelector;
  mode?: number;
}

export interface ObjectFieldSelector {
  apiVersion?: string;
  fieldPath: string;
}

export interface ResourceFieldSelector {
  containerName?: string;
  resource: string;
  divisor?: string;
}

export interface NFSVolumeSource {
  server: string;
  path: string;
  readOnly?: boolean;
}

export interface CSIVolumeSource {
  driver: string;
  readOnly?: boolean;
  fsType?: string;
  volumeAttributes?: Record<string, string>;
  nodePublishSecretRef?: LocalObjectReference;
}

export interface LocalObjectReference {
  name?: string;
}

// PersistentVolume Types (from Go types.go lines 866-878)
export type PersistentVolumeAccessMode =
  | "ReadWriteOnce"
  | "ReadOnlyMany"
  | "ReadWriteMany"
  | "ReadWriteOncePod";

export type PersistentVolumeMode = "Block" | "Filesystem";

// VolumeResourceRequirements (from Go types.go lines 2712-2728)
export interface VolumeResourceRequirements {
  limits?: ResourceList;
  requests?: ResourceList;
}

// PersistentVolumeClaimSpec (aligned with Go types.go lines 554-632)
export interface PersistentVolumeClaimSpec {
  accessModes?: PersistentVolumeAccessMode[];
  selector?: LabelSelector;
  resources?: VolumeResourceRequirements;
  volumeName?: string;
  storageClassName?: string;
  volumeMode?: PersistentVolumeMode;
  dataSource?: TypedLocalObjectReference;
  dataSourceRef?: TypedObjectReference;
  volumeAttributesClassName?: string;
}

export interface TypedLocalObjectReference {
  apiGroup?: string;
  kind: string;
  name: string;
}

export interface TypedObjectReference {
  apiGroup?: string;
  kind: string;
  name: string;
  namespace?: string;
}

// PersistentVolumeSpec for persistent volumes
export interface PersistentVolumeSpec {
  capacity?: ResourceList;
  volumeMode?: PersistentVolumeMode;
  accessModes?: PersistentVolumeAccessMode[];
  persistentVolumeReclaimPolicy?: "Retain" | "Recycle" | "Delete";
  storageClassName?: string;
  volumeAttributes?: Record<string, string>;
  nodeAffinity?: {
    required?: {
      nodeSelectorTerms?: Array<{
        matchExpressions?: Array<{
          key: string;
          operator: string;
          values?: string[];
        }>;
        matchFields?: Array<{
          key: string;
          operator: string;
          values?: string[];
        }>;
      }>;
    };
  };
  // Volume source (simplified - actual implementation has many more fields)
  hostPath?: {
    path: string;
    type?: string;
  };
  nfs?: {
    server: string;
    path: string;
    readOnly?: boolean;
  };
  csi?: {
    driver: string;
    volumeHandle: string;
    readOnly?: boolean;
    fsType?: string;
    volumeAttributes?: Record<string, string>;
    controllerPublishSecretRef?: {
      name: string;
      namespace: string;
    };
    nodeStageSecretRef?: {
      name: string;
      namespace: string;
    };
    nodePublishSecretRef?: {
      name: string;
      namespace: string;
    };
    controllerExpandSecretRef?: {
      name: string;
      namespace: string;
    };
  };
}

export interface PersistentVolumeStatus {
  phase?: "Pending" | "Available" | "Bound" | "Released" | "Failed";
  message?: string;
  reason?: string;
  lastPhaseTransitionTime?: string;
}

export interface PersistentVolumeClaimStatus {
  phase?: "Pending" | "Bound" | "Lost";
  accessModes?: PersistentVolumeAccessMode[];
  capacity?: ResourceList;
  conditions?: Array<{
    type: string;
    status: string;
    lastProbeTime?: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
  }>;
  allocatedResources?: ResourceList;
  resizeStatus?: string;
}

export interface PersistentVolumeObject extends KubernetesObject {
  kind: "PersistentVolume";
  apiVersion: "v1";
  spec: PersistentVolumeSpec;
  status: PersistentVolumeStatus;
}

export interface PersistentVolumeClaimObject extends KubernetesObject {
  kind: "PersistentVolumeClaim";
  apiVersion: "v1";
  spec: PersistentVolumeClaimSpec;
  status: PersistentVolumeClaimStatus;
}

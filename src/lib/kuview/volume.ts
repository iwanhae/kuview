import type { KubernetesObject, ResourceList } from "./types";
import type { PersistentVolumeClaimSpec } from "./pod";

export interface PersistentVolumeSpec {
  capacity?: ResourceList;
  volumeMode?: "Filesystem" | "Block";
  accessModes?: (
    | "ReadWriteOnce"
    | "ReadOnlyMany"
    | "ReadWriteMany"
    | "ReadWriteOncePod"
  )[];
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
  accessModes?: (
    | "ReadWriteOnce"
    | "ReadOnlyMany"
    | "ReadWriteMany"
    | "ReadWriteOncePod"
  )[];
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

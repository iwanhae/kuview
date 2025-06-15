import type { Condition } from "../status";

export type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
};

export interface KuviewExtra extends Condition {
  [key: string]: unknown;
}

export interface KubernetesObject {
  kind: string;
  apiVersion: string;
  metadata: Metadata;
  finalizers?: string[];
  spec: unknown;
  status: unknown;

  kuviewExtra?: KuviewExtra;
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
  deletionGracePeriodSeconds?: number;
  generation?: number;
  managedFields?: ManagedFieldsEntry[];
}

export interface ManagedFieldsEntry {
  manager?: string;
  operation?: "Apply" | "Update";
  apiVersion?: string;
  time?: string;
  fieldsType?: string;
  fieldsV1?: unknown;
  subresource?: string;
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

export interface ResourceList {
  [key: string]: string;
}

export interface ObjectReference {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  uid?: string;
}

export interface KeyToPath {
  key: string;
  path: string;
  mode?: number;
}

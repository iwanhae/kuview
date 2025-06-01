export type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
};

export interface KubernetesObject {
  kind: string
  apiVersion: string
  metadata: Metadata
  finalizers?: string[]
  spec?: Record<string, unknown>
  status?: Record<string, unknown>
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
}

export interface Labels {
  [key: string]: string | undefined
}

export interface Annotations {
  [key: string]: string | undefined
}


import { } from "zustand";

export type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
};

export interface KubernetesObject {
  kind: string
  apiVersion: string
  metadata: Metadata
}

export interface Metadata {
  name: string
  uid: string
  resourceVersion: string
  creationTimestamp: string
  labels: Labels
  annotations: Annotations
  finalizers: string[]
}

export interface Labels {
  "beta.kubernetes.io/arch": string
  "beta.kubernetes.io/instance-type": string
  "beta.kubernetes.io/os": string
  "kubernetes.io/arch": string
  "kubernetes.io/hostname": string
  "kubernetes.io/os": string
  "node-role.kubernetes.io/control-plane": string
  "node-role.kubernetes.io/master": string
  "node.kubernetes.io/instance-type": string
  [key: string]: string
}

export interface Annotations {
  "alpha.kubernetes.io/provided-node-ip": string
  "node.alpha.kubernetes.io/ttl": string
  "volumes.kubernetes.io/controller-managed-attach-detach": string
  [key: string]: string
}


import type { KubernetesObject, Metadata } from "./types";

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

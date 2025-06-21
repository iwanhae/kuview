import type { LabelSelector, Metadata } from "./types";

export interface PolicyRule {
  verbs: string[];
  apiGroups?: string[];
  resources?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
}

export interface Subject {
  kind: "User" | "Group" | "ServiceAccount";
  name: string;
  apiGroup?: string;
  namespace?: string;
}

export interface RoleRef {
  apiGroup: string;
  kind: "Role" | "ClusterRole";
  name: string;
}

export interface AggregationRule {
  clusterRoleSelectors?: LabelSelector[];
}

export interface RoleObject {
  kind: "Role";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: Metadata;
  rules?: PolicyRule[];
}

export interface RoleBindingObject {
  kind: "RoleBinding";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: Metadata;
  subjects?: Subject[];
  roleRef: RoleRef;
}

export interface ClusterRoleObject {
  kind: "ClusterRole";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: Metadata;
  rules?: PolicyRule[];
  aggregationRule?: AggregationRule;
}

export interface ClusterRoleBindingObject {
  kind: "ClusterRoleBinding";
  apiVersion: "rbac.authorization.k8s.io/v1";
  metadata: Metadata;
  subjects?: Subject[];
  roleRef: RoleRef;
}

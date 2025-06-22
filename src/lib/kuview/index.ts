// Re-export all types from sub-modules
export * from "./types";
export * from "./pod";
export * from "./service";
export * from "./node";
export * from "./endpoint";
export * from "./namespace";
export * from "./metrics";
export * from "./rbac";
export * from "./usergroup";
export * from "./volume";

// Import specific types for the object map
import type { PodObject } from "./pod";
import type { ServiceObject } from "./service";
import type { NodeObject } from "./node";
import type { EndpointSliceObject } from "./endpoint";
import type { NamespaceObject } from "./namespace";
import type { NodeMetricsObject, PodMetricsObject } from "./metrics";
import type {
  RoleObject,
  RoleBindingObject,
  ClusterRoleObject,
  ClusterRoleBindingObject,
} from "./rbac";
import type { UserGroupObject } from "./usergroup";
import type {
  PersistentVolumeObject,
  PersistentVolumeClaimObject,
} from "./volume";

export interface KuviewObjectMap {
  "v1/Pod": PodObject;
  "v1/Service": ServiceObject;
  "v1/Node": NodeObject;
  "v1/Namespace": NamespaceObject;
  "v1/PersistentVolume": PersistentVolumeObject;
  "v1/PersistentVolumeClaim": PersistentVolumeClaimObject;
  "discovery.k8s.io/v1/EndpointSlice": EndpointSliceObject;
  "metrics.k8s.io/v1beta1/NodeMetrics": NodeMetricsObject;
  "metrics.k8s.io/v1beta1/PodMetrics": PodMetricsObject;
  "rbac.authorization.k8s.io/v1/Role": RoleObject;
  "rbac.authorization.k8s.io/v1/RoleBinding": RoleBindingObject;
  "rbac.authorization.k8s.io/v1/ClusterRole": ClusterRoleObject;
  "rbac.authorization.k8s.io/v1/ClusterRoleBinding": ClusterRoleBindingObject;
  "kuview.iwanhae.kr/v1/UserGroup": UserGroupObject;
}

export type GVK = keyof KuviewObjectMap;

export type KuviewObjectType<T extends GVK> = KuviewObjectMap[T];

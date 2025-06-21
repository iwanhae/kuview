import type { KubernetesObject, KuviewExtra, Metadata } from "./types";
import type {
  ClusterRoleBindingObject,
  ClusterRoleObject,
  RoleBindingObject,
  RoleObject,
} from ".";

export interface UserGroupObject extends KubernetesObject {
  kind: "UserGroup";
  apiVersion: "kuview.iwanhae.kr/v1";
  metadata: Metadata;
  spec: UserGroupSpec;

  kuviewExtra?: KuviewExtra;
}

export interface UserGroupSpec {
  bindings: (RoleBindingObject | ClusterRoleBindingObject)[];
  roles: (RoleObject | ClusterRoleObject)[];
  type: "User" | "Group";
}

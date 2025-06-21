import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { kubernetesAtom } from "@/lib/kuviewAtom";
import {
  type ClusterRoleObject,
  type RoleObject,
  type UserGroupObject,
  type UserGroupSpec,
} from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";
import { Status, type Condition } from "@/lib/status";

// Create an virtual resource kuview.iwanhae.kr/v1/UserGroup
export function SyncUserGroup() {
  const r = useKuview("rbac.authorization.k8s.io/v1/Role");
  const rb = useKuview("rbac.authorization.k8s.io/v1/RoleBinding");
  const cr = useKuview("rbac.authorization.k8s.io/v1/ClusterRole");
  const crb = useKuview("rbac.authorization.k8s.io/v1/ClusterRoleBinding");

  const kubernetes = useAtomValue(kubernetesAtom);

  const userGroupAtom = kubernetes["kuview.iwanhae.kr/v1/UserGroup"];
  const setUserGroup = useSetAtom(userGroupAtom);

  useEffect(() => {
    const ug = new Map<string, UserGroupSpec>();

    for (const binding of [...Object.values(rb), ...Object.values(crb)]) {
      // find the role
      let role: RoleObject | ClusterRoleObject | undefined = undefined;
      if (binding.roleRef.kind === "Role") {
        role =
          r[`${binding.metadata.namespace}/${binding.roleRef.name}`] ??
          undefined;
      } else if (binding.roleRef.kind === "ClusterRole") {
        role = cr[binding.roleRef.name] ?? undefined;
      }

      if (!role) {
        continue;
      }

      // assign roles to subjects
      for (const subject of binding.subjects || []) {
        let name = subject.name;
        let s: UserGroupSpec;
        switch (subject.kind) {
          case "User":
            s = ug.get(name) ?? { bindings: [], roles: [], type: "User" };
            ug.set(name, {
              bindings: [binding, ...s.bindings],
              roles: [role, ...s.roles],
              type: "User",
            });
            break;
          case "ServiceAccount":
            name = `system:serviceaccount:${subject.namespace}:${subject.name}`;
            s = ug.get(name) ?? { bindings: [], roles: [], type: "User" };
            ug.set(name, {
              bindings: [binding, ...s.bindings],
              roles: [role, ...s.roles],
              type: "User",
            });
            break;
          case "Group":
            name = `@${name}`;
            s = ug.get(name) ?? { bindings: [], roles: [], type: "Group" };
            ug.set(name, {
              bindings: [binding, ...s.bindings],
              roles: [role, ...s.roles],
              type: "Group",
            });
            break;
        }
      }
    }

    const result: Record<string, UserGroupObject> = {};

    for (const [name, spec] of ug) {
      result[name] = {
        kind: "UserGroup",
        apiVersion: "kuview.iwanhae.kr/v1",
        metadata: {
          name,
          uid: "",
          resourceVersion: "",
          creationTimestamp: "",
        },
        spec,
        status: {},
        kuviewExtra: { ...getStatus(spec.roles) },
      };
    }

    setUserGroup(result);
  }, [r, rb, cr, crb, setUserGroup]);

  return <></>;
}

function getStatus(roles: (RoleObject | ClusterRoleObject)[]): Condition {
  // Error: no roles
  if (roles.length === 0) {
    return {
      status: Status.Error,
      reason: "has no roles",
    };
  }

  // Error: all roles have no rules
  if (roles.every((role) => (role.rules ?? []).length === 0)) {
    return {
      status: Status.Error,
      reason: `has ${roles.length} roles, but all of them have no rules`,
    };
  }

  // Warn: if has ClusterRole named cluster-admin
  if (roles.some((role) => role.metadata.name === "cluster-admin")) {
    return {
      status: Status.Warning,
      reason: "has cluster-admin role, which is too powerful",
    };
  }

  return {
    status: Status.Running,
    reason: `has ${roles.length} roles`,
  };
}

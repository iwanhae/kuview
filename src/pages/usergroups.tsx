import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import UserGroupDetail from "@/components/block/usergroup-detail";
import type { UserGroupObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function UserGroupsPage() {
  const userGroups = useKuview("kuview.iwanhae.kr/v1/UserGroup");
  const [selectedUserGroup, setSelectedUserGroup] =
    useState<UserGroupObject | null>(null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2">
      {/* Left Panel - UserGroup List */}
      <div className="flex flex-col gap-6 w-full px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">User Groups</h1>
          <span className="text-sm text-muted-foreground">
            ({Object.keys(userGroups).length})
          </span>
        </div>

        {/* Search */}
        <SearchComponent<UserGroupObject>
          resources={Object.values(userGroups)}
          getResourceId={(userGroup) => userGroup.metadata.name}
          getResourceStatus={getStatus}
          onResourceSelect={(id) =>
            setSelectedUserGroup(userGroups[id] || null)
          }
          selectedResourceId={selectedUserGroup?.metadata.name}
          resourceTypeName="user group"
          urlResourceParam="usergroup"
          urlFilterParam="usergroupFilter"
        />
      </div>

      {/* Right Panel - UserGroup Detail */}
      {selectedUserGroup && (
        <UserGroupDetail
          userGroup={selectedUserGroup}
          className="w-full px-4"
        />
      )}
    </div>
  );
}

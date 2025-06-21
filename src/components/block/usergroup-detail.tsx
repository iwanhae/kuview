import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserGroupObject } from "@/lib/kuview";
import { STATUS_COLORS, Status } from "@/lib/status";
import Metadata from "./metadata";
import UserGroupOverview from "./usergroup-overview";
import UserGroupAllRules from "./usergroup-all-rules";
import UserGroupRoles from "./usergroup-roles";
import UserGroupBindings from "./usergroup-bindings";

interface UserGroupDetailProps {
  userGroup: UserGroupObject;
  className?: string;
}

export default function UserGroupDetail({
  userGroup,
  className,
}: UserGroupDetailProps) {
  const status = userGroup.kuviewExtra?.status || Status.Error;
  const reason = userGroup.kuviewExtra?.reason || "";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {userGroup.metadata.name}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    STATUS_COLORS[status]?.bgColor,
                    STATUS_COLORS[status]?.textColor,
                  )}
                >
                  {userGroup.spec.type}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{reason}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <UserGroupOverview userGroup={userGroup} />

      {/* All Rules */}
      <UserGroupAllRules userGroup={userGroup} />

      {/* Roles */}
      <UserGroupRoles userGroup={userGroup} />

      {/* Bindings */}
      <UserGroupBindings userGroup={userGroup} />

      {/* Metadata */}
      <Metadata metadata={userGroup.metadata} />
    </div>
  );
}

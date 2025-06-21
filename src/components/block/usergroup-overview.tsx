import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserGroupObject } from "@/lib/kuview";

interface UserGroupOverviewProps {
  userGroup: UserGroupObject;
}

export default function UserGroupOverview({
  userGroup,
}: UserGroupOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {userGroup.spec.roles.length}
            </div>
            <div className="text-sm text-muted-foreground">Roles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {userGroup.spec.bindings.length}
            </div>
            <div className="text-sm text-muted-foreground">Bindings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {userGroup.spec.roles.reduce(
                (acc, role) => acc + (role.rules?.length || 0),
                0,
              )}
            </div>
            <div className="text-sm text-muted-foreground">Rules</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

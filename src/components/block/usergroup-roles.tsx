import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { UserGroupObject } from "@/lib/kuview";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RulesTable } from "./rules-table";

interface UserGroupRolesProps {
  userGroup: UserGroupObject;
}

export default function UserGroupRoles({ userGroup }: UserGroupRolesProps) {
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());

  const toggleRole = (index: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRoles(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles ({userGroup.spec.roles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userGroup.spec.roles.map((role, index) => (
            <div key={index} className="border rounded-lg">
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRole(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedRoles.has(index) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium">{role.metadata.name}</span>
                    <Badge
                      variant={
                        role.kind === "ClusterRole" ? "default" : "secondary"
                      }
                    >
                      {role.kind}
                    </Badge>
                    {role.metadata.namespace && (
                      <Badge variant="outline">{role.metadata.namespace}</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {role.rules?.length || 0} rules
                  </span>
                </div>
              </div>

              {expandedRoles.has(index) &&
                role.rules &&
                role.rules.length > 0 && (
                  <div className="px-3 pb-3">
                    <Separator className="mb-3" />
                    <RulesTable rules={role.rules} />
                  </div>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

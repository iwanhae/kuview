import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PolicyRule, UserGroupObject } from "@/lib/kuview";
import { RulesTable } from "./rules-table";

interface UserGroupAllRulesProps {
  userGroup: UserGroupObject;
}

export default function UserGroupAllRules({
  userGroup,
}: UserGroupAllRulesProps) {
  // Flatten all rules from all roles for the "All Rules" section
  const allRules: Array<PolicyRule> = [];
  const allRuleTypes: string[] = [];
  const allRuleNamespaces: (string | undefined)[] = [];

  userGroup.spec.roles.forEach((role) => {
    if (role.rules) {
      role.rules.forEach((rule) => {
        allRules.push(rule);
        allRuleTypes.push(role.kind);
        allRuleNamespaces.push(role.metadata.namespace);
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Rules ({allRules.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {allRules.length > 0 ? (
          <RulesTable
            rules={allRules}
            showRoleInfo={true}
            roleTypes={allRuleTypes}
            roleNamespaces={allRuleNamespaces}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No rules found</p>
        )}
      </CardContent>
    </Card>
  );
}

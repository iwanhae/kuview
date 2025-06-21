import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PolicyRule } from "@/lib/kuview";

// Common Rules Table Component
export interface RulesTableProps {
  rules: Array<PolicyRule>;
  showRoleInfo?: boolean;
  roleTypes?: string[];
  roleNamespaces?: (string | undefined)[];
}

export function RulesTable({
  rules,
  showRoleInfo = false,
  roleTypes = [],
  roleNamespaces = [],
}: RulesTableProps) {
  type SortField = "scope" | "apiGroups" | "resources" | "verbs";
  type SortDirection = "ascending" | "descending";

  interface SortState {
    key: SortField;
    direction: SortDirection;
  }

  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "verbs",
    direction: "descending",
  });

  const verbOrder: { [key: string]: number } = {
    delete: 5,
    create: 4,
    list: 3,
    get: 2,
    watch: 1,
  };

  const handleSort = (key: SortField) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  };

  const sortedData = useMemo(() => {
    const sortableItems = rules.map((rule, index) => ({
      ...rule,
      roleType: showRoleInfo ? roleTypes[index] : undefined,
      roleNamespace: showRoleInfo ? roleNamespaces[index] : undefined,
    }));

    sortableItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "scope": {
          const aIsClusterRole = a.roleType === "ClusterRole";
          const bIsClusterRole = b.roleType === "ClusterRole";
          if (aIsClusterRole !== bIsClusterRole) {
            aValue = aIsClusterRole ? 1 : 0;
            bValue = bIsClusterRole ? 1 : 0;
          } else {
            aValue = a.roleNamespace || "default";
            bValue = b.roleNamespace || "default";
          }
          break;
        }
        case "apiGroups":
          aValue = (a.apiGroups || []).sort().join(", ");
          bValue = (b.apiGroups || []).sort().join(", ");
          break;
        case "resources":
          aValue = (a.resources || []).sort().join(", ");
          bValue = (b.resources || []).sort().join(", ");
          break;
        case "verbs":
          aValue = Math.max(0, ...a.verbs.map((v) => verbOrder[v] || 0));
          bValue = Math.max(0, ...b.verbs.map((v) => verbOrder[v] || 0));
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
      }
    });

    return sortableItems.map((rule) => ({
      ...rule,
      apiGroups: [...(rule.apiGroups || [])].sort(),
      resources: [...(rule.resources || [])].sort(),
      verbs: [...rule.verbs].sort(
        (a, b) => (verbOrder[b] || 0) - (verbOrder[a] || 0),
      ),
    }));
  }, [rules, roleTypes, roleNamespaces, showRoleInfo, sortConfig]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showRoleInfo && (
              <SortableHeader
                field="scope"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Scope
              </SortableHeader>
            )}
            <SortableHeader
              field="apiGroups"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              API Groups
            </SortableHeader>
            <SortableHeader
              field="resources"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Resources
            </SortableHeader>
            <SortableHeader
              field="verbs"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Verbs
            </SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((rule, ruleIndex) => (
            <TableRow key={ruleIndex} className="border-b last:border-b-0">
              {showRoleInfo && (
                <TableCell className="p-2 align-top flex w-[120px] overflow-x-scroll">
                  {rule.roleType === "Role" && (
                    <Badge variant="outline" className="text-xs m-auto">
                      {rule.roleNamespace || "default"}
                    </Badge>
                  )}
                  {rule.roleType === "ClusterRole" && (
                    <p className="m-auto">*</p>
                  )}
                </TableCell>
              )}
              <TableCell className="p-2 align-top w-[200px] overflow-x-scroll">
                <div className="flex flex-wrap gap-1">
                  {rule.apiGroups?.map((apiGroup, apiIndex) => (
                    <Badge key={apiIndex} variant="outline" className="text-xs">
                      {apiGroup || "core"}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="p-2 align-top w-full">
                <div className="flex flex-wrap gap-1">
                  {rule.resources?.map((resource, resIndex) => (
                    <Badge key={resIndex} variant="outline" className="text-xs">
                      {resource}
                    </Badge>
                  ))}
                  {rule.nonResourceURLs?.map((url, urlIndex) => (
                    <Badge key={urlIndex} variant="outline" className="text-xs">
                      {url}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell className="p-2 align-top">
                <div className="flex flex-wrap gap-1">
                  {rule.verbs
                    .sort((a, b) => (verbOrder[b] - verbOrder[a] > 0 ? 1 : -1))
                    .map((verb, verbIndex) => (
                      <Badge
                        key={verbIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {verb}
                      </Badge>
                    ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableHeader({
  children,
  field,
  currentSort,
  onSort,
  className = "",
}: {
  children: ReactNode;
  field: "scope" | "apiGroups" | "resources" | "verbs";
  currentSort: { key: string; direction: string };
  onSort: (field: "scope" | "apiGroups" | "resources" | "verbs") => void;
  className?: string;
}) {
  const isActive = currentSort.key === field;

  return (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 p-2">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 transition-colors ${
              isActive && currentSort.direction === "ascending"
                ? "text-primary"
                : "text-muted-foreground/30"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 transition-colors ${
              isActive && currentSort.direction === "descending"
                ? "text-primary"
                : "text-muted-foreground/30"
            }`}
          />
        </div>
      </div>
    </TableHead>
  );
}

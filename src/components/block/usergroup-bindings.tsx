import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { UserGroupObject } from "@/lib/kuview";
import { ArrowDown, ChevronDown, ChevronRight } from "lucide-react";

interface UserGroupBindingsProps {
  userGroup: UserGroupObject;
}

export default function UserGroupBindings({
  userGroup,
}: UserGroupBindingsProps) {
  const [expandedBindings, setExpandedBindings] = useState<Set<number>>(
    new Set(),
  );

  const toggleBinding = (index: number) => {
    const newExpanded = new Set(expandedBindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBindings(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Bindings ({userGroup.spec.bindings.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userGroup.spec.bindings.map((binding, index) => (
            <div key={index} className="border rounded-lg">
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleBinding(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedBindings.has(index) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium">{binding.metadata.name}</span>
                    <Badge
                      variant={
                        binding.kind === "ClusterRoleBinding"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {binding.kind}
                    </Badge>
                    {binding.metadata.namespace && (
                      <Badge variant="outline">
                        {binding.metadata.namespace}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {expandedBindings.has(index) &&
                binding.subjects &&
                binding.subjects.length > 0 && (
                  <div className="px-3 pb-3">
                    {binding.roleRef && (
                      <div className="mt-3">
                        <Separator className="mb-3" />
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="font-medium">Kind:</span>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {binding.roleRef.kind}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Name:</span>
                              <div className="mt-1 font-mono text-xs">
                                {binding.roleRef.name}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">API Group:</span>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {binding.roleRef.apiGroup ||
                                    "rbac.authorization.k8s.io"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex p-3">
                      <ArrowDown className="m-auto" />
                    </div>
                    <div className="space-y-2">
                      {binding.subjects.map((subject, subjectIndex) => (
                        <div
                          key={subjectIndex}
                          className="bg-gray-50 p-2 rounded text-sm"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="font-medium">Kind:</span>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {subject.kind}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Name:</span>
                              <div className="mt-1 font-mono text-xs">
                                {subject.name}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Namespace:</span>
                              <div className="mt-1">
                                {subject.namespace ? (
                                  <Badge variant="outline" className="text-xs">
                                    {subject.namespace}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

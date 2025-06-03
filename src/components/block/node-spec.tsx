import type { NodeObject } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface NodeSpecProps {
  spec: NodeObject["spec"];
}

const getTaintEffectColor = (effect: string) => {
  switch (effect) {
    case "NoSchedule":
      return "bg-red-100 text-red-800";
    case "PreferNoSchedule":
      return "bg-yellow-100 text-yellow-800";
    case "NoExecute":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function NodeSpecComponent({ spec }: NodeSpecProps) {
  const [taintsExpanded, setTaintsExpanded] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spec</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          {spec.podCIDR && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Pod CIDR
              </label>
              <p className="text-sm font-mono">{spec.podCIDR}</p>
            </div>
          )}
          {spec.providerID && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Provider ID
              </label>
              <p className="text-sm font-mono">{spec.providerID}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Schedulable
            </label>
            <div className="flex items-center gap-2">
              <Badge variant={spec.unschedulable ? "destructive" : "default"}>
                {spec.unschedulable ? "Unschedulable" : "Schedulable"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Pod CIDRs */}
        {spec.podCIDRs && spec.podCIDRs.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Pod CIDRs
            </label>
            <div className="flex flex-wrap gap-1">
              {spec.podCIDRs.map((cidr, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {cidr}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Taints */}
        {spec.taints && spec.taints.length > 0 && (
          <Collapsible open={taintsExpanded} onOpenChange={setTaintsExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <h4 className="text-sm font-medium">
                Taints ({spec.taints.length})
              </h4>
              <span className="text-xs">{taintsExpanded ? "▼" : "▶"}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {spec.taints.map((taint, index) => (
                <div key={index} className="border rounded p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm font-mono">
                      {taint.key}
                    </span>
                    <Badge
                      className={getTaintEffectColor(taint.effect)}
                      variant="outline"
                    >
                      {taint.effect}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1">
                    {taint.value && (
                      <div>
                        <span className="text-muted-foreground">Value:</span>{" "}
                        {taint.value}
                      </div>
                    )}
                    {taint.timeAdded && (
                      <div>
                        <span className="text-muted-foreground">Added:</span>{" "}
                        {new Date(taint.timeAdded).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {spec.taints && spec.taints.length === 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Taints
            </label>
            <p className="text-sm text-muted-foreground">No taints</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

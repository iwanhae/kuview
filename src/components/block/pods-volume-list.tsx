import type { PodObject, Volume } from "@/lib/kuview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { PREFIX } from "@/lib/const";

interface NodeVolumeListProps {
  pods: PodObject[];
}

function getVolumeType(volume: Volume): string {
  if (volume.hostPath) return "HostPath";
  if (volume.emptyDir) return "EmptyDir";
  if (volume.secret) return "Secret";
  if (volume.persistentVolumeClaim) return "PersistentVolumeClaim";
  if (volume.configMap) return "ConfigMap";
  if (volume.ephemeral) return "Ephemeral";
  if (volume.projected) return "Projected";
  return "Unknown";
}

function getVolumeTypeColor(
  type: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "PersistentVolumeClaim":
      return "secondary";
    case "HostPath":
      return "outline";
    case "Secret":
      return "secondary";
    case "ConfigMap":
      return "outline";
    default:
      return "outline";
  }
}

function getVolumeDetails(volume: Volume): string {
  if (volume.persistentVolumeClaim) {
    const details = [`${volume.persistentVolumeClaim.claimName}`];
    if (volume.persistentVolumeClaim.readOnly) {
      details.push("(Read Only)");
    }
    return details.join(" ");
  }

  if (volume.hostPath) {
    return `${volume.hostPath.path}`;
  }

  if (volume.emptyDir) {
    const details = [];
    if (volume.emptyDir.medium) {
      details.push(`${volume.emptyDir.medium}`);
    }
    if (volume.emptyDir.sizeLimit) {
      details.push(`${volume.emptyDir.sizeLimit}`);
    }
    return details.length > 0 ? details.join(", ") : "EmptyDir";
  }

  if (volume.configMap) {
    return `${volume.configMap.name}`;
  }

  if (volume.secret) {
    return `${volume.secret.secretName}`;
  }

  return "-";
}

const volumeTypeSortOrder: Record<string, number> = {
  PersistentVolumeClaim: 1,
  HostPath: 2,
  Ephemeral: 3,
  EmptyDir: 4,
  ConfigMap: 5,
  Secret: 6,
  Projected: 7,
  Unknown: 99,
};

export default function PodsVolumeList({ pods }: NodeVolumeListProps) {
  const allVolumes =
    pods?.flatMap(
      (pod) =>
        pod.spec.volumes?.map((v) => ({
          ...v,
          nickName: `${pod.metadata.namespace}/${pod.metadata.name}`,
        })) ?? [],
    ) ?? [];

  const filteredVolumes = allVolumes.filter(
    (volume) => !volume.name.startsWith("kube-api-access-"),
  );

  const sortedVolumes = filteredVolumes.sort((a, b) => {
    const typeA = getVolumeType(a);
    const typeB = getVolumeType(b);
    const typeDiff =
      (volumeTypeSortOrder[typeA] ?? 99) - (volumeTypeSortOrder[typeB] ?? 99);
    if (typeDiff !== 0) return typeDiff;

    // Secondary sort by volume name
    return a.name.localeCompare(b.name);
  });

  if (sortedVolumes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Volumes
          <Badge variant="outline" className="text-xs">
            {sortedVolumes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 max-h-[300px] overflow-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pod</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVolumes.map((volume) => {
              const volumeType = getVolumeType(volume);
              return (
                <TableRow key={`${volume.nickName}-${volume.name}`}>
                  <TableCell>
                    <div className="space-y-1 w-[200px] overflow-scroll">
                      <Link
                        to={`${PREFIX}/pods?pod=${volume.nickName}`}
                        className="hover:underline font-medium text-sm"
                      >
                        {volume.nickName}
                      </Link>
                      <div className="text-sm text-muted-foreground font-mono">
                        {volume.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getVolumeTypeColor(volumeType)}
                      className="text-xs"
                    >
                      {volumeType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {getVolumeDetails(volume)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import type { PodObject, Volume } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function NodeVolumeList({ pods }: NodeVolumeListProps) {
  const volumes = pods.flatMap(
    (pod) =>
      pod.spec.volumes?.map((v) => ({ ...v, podName: pod.metadata.name })) ??
      [],
  );

  if (volumes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volumes.map((volume) => (
            <div
              key={`${volume.podName}-${volume.name}`}
              className="p-4 border rounded-md"
            >
              <p className="font-semibold">{volume.name}</p>
              <p className="text-sm text-muted-foreground">
                {getVolumeType(volume)}
              </p>
              <p className="text-xs text-muted-foreground">
                Pod: {volume.podName}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

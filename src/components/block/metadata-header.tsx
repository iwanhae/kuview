import type { KubernetesObject } from "@/lib/kuview";
import { getStatus, getStatusColor } from "@/lib/status";
import dayjs from "dayjs";
import Copy from "./copy";

interface Props {
  object: KubernetesObject;
  showCommand?: boolean;
}

export default function MetadataHeader({ object, showCommand = true }: Props) {
  const metadata = object.metadata;
  const condition = getStatus(object);
  const command = `kubectl get ${object.kind.toLowerCase()} ${
    metadata.namespace ? `-n ${metadata.namespace} ` : ""
  }${metadata.name}`;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">{metadata.name}</h2>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 ${getStatusColor(condition.status)}`} />
          <div className="text-sm text-muted-foreground">
            {condition.reason}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Created at {dayjs(metadata.creationTimestamp).format()}
        </p>
      </div>
      {showCommand && <Copy text={command} />}
    </div>
  );
}

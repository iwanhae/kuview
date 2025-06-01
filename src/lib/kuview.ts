import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type KuviewEvent = {
  type: "create" | "update" | "delete" | "generic";
  object: KubernetesObject;
};

export interface KubernetesObject {
  kind: string
  apiVersion: string
  metadata: Metadata
  finalizers?: string[]
  spec?: Record<string, unknown>
  status?: Record<string, unknown>
}

export interface Metadata {
  name: string
  uid: string
  resourceVersion: string
  creationTimestamp: string
  labels?: Labels
  annotations?: Annotations
  finalizers?: string[]
  namespace?: string
}

export interface Labels {
  [key: string]: string | undefined
}

export interface Annotations {
  [key: string]: string | undefined
}

type StoredKubernetesObject = Pick<KubernetesObject, "kind" | "apiVersion" | "metadata">;

type ChangeOperation =
  | { type: 'UPSERT'; object: StoredKubernetesObject }
  | { type: 'DELETE' };

interface KuviewStore {
  objects: Record<string, Record<string, StoredKubernetesObject>>;
  handleEvent: (event: KuviewEvent) => void;
}

let debounceTimer: NodeJS.Timeout | null = null;
const PENDING_CHANGES: Map<string, Map<string, ChangeOperation>> = new Map();

const DEBOUNCE_MS = 100;

export const useKuviewStore = create(
  immer<KuviewStore>((set) => ({
    objects: {},
    handleEvent: (event: KuviewEvent) => {
      const { kind, apiVersion, metadata } = event.object;
      if (!metadata || !metadata.name) {
        console.warn("Received event with missing metadata or name, skipping:", event);
        return;
      }

      const resourceTypeKey = `${apiVersion}/${kind}`;
      const resourceKey = metadata.namespace ? `${metadata.namespace}/${metadata.name}` : metadata.name;

      if (!PENDING_CHANGES.has(resourceTypeKey)) {
        PENDING_CHANGES.set(resourceTypeKey, new Map());
      }
      const typeChangesMap = PENDING_CHANGES.get(resourceTypeKey)!;

      const storedObjectData: StoredKubernetesObject = {
        kind,
        apiVersion,
        metadata,
      };

      switch (event.type) {
        case "create":
        case "update":
        case "generic":
          typeChangesMap.set(resourceKey, { type: 'UPSERT', object: storedObjectData });
          break;
        case "delete":
          typeChangesMap.set(resourceKey, { type: 'DELETE' });
          break;
        default:
          console.warn("Received unknown event type:", event.type);
          return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        set((state) => {
          PENDING_CHANGES.forEach((changesMap, rtk) => {
            if (!state.objects[rtk] && changesMap.size > 0) {
              let hasUpsert = false;
              changesMap.forEach(op => { if (op.type === 'UPSERT') hasUpsert = true; });
              if (hasUpsert) state.objects[rtk] = {};
            }

            changesMap.forEach((operation, rk) => {
              if (operation.type === 'UPSERT') {
                if (!state.objects[rtk]) state.objects[rtk] = {};
                state.objects[rtk][rk] = operation.object;
              } else if (operation.type === 'DELETE') {
                if (state.objects[rtk]) {
                  delete state.objects[rtk][rk];
                  if (Object.keys(state.objects[rtk]).length === 0) {
                    delete state.objects[rtk];
                  }
                }
              }
            });
          });
          PENDING_CHANGES.clear();
          debounceTimer = null;
        });
      }, DEBOUNCE_MS);
    },
  }))
);


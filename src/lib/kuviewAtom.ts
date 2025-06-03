import { atom, useAtom, useAtomValue, type PrimitiveAtom } from "jotai";
import type { KubernetesObject, KuviewEvent } from "./kuview";
import { useEffect } from "react";

const DEBOUNCE_MS = 100;

export const kubernetesAtom = atom<Record<string /* GroupVersionKind */, ObjectAtom>>({});

type ObjectAtom = PrimitiveAtom<Record<string /* NamespaceName */, KubernetesObject>>;

type _change_operation = { type: 'UPSERT' | 'DELETE'; object: KubernetesObject }


const PENDING_CHANGES: _change_operation[] = [];

export function handleEvent(event: KuviewEvent) {
  switch (event.type) {
    case 'create':
    case 'update':
    case 'generic':
      PENDING_CHANGES.push({ type: 'UPSERT', object: event.object });
      break;
    case 'delete':
      PENDING_CHANGES.push({ type: 'DELETE', object: event.object });
      break;
  }
}

export function useKubernetesSyncHook(): Array<string> {
  const [kubernetes, setKubernetes] = useAtom(kubernetesAtom);

  useEffect(() => {
    const interval = setInterval(() => {
      // make a list of distinct gvks in PENDING_CHANGES
      const gvks = new Set<string>();
      PENDING_CHANGES.forEach((operation) => {
        const { object } = operation;
        const { kind, apiVersion } = object;
        gvks.add(`${apiVersion}/${kind}`);
      });

      // create a new GVK atom if it doesn't exist in kubernetes atom
      gvks.forEach((gvk) => {
        if (!kubernetes[gvk]) {
          kubernetes[gvk] = atom<Record<string, KubernetesObject>>({});
        }
      });
      setKubernetes({ ...kubernetes });
    }, DEBOUNCE_MS);
    return () => clearInterval(interval);
  }, [kubernetes, setKubernetes])

  return Object.keys(kubernetes);
}

export function useGVKSyncHook(gvk: string) {
  const kubernetes = useAtomValue(kubernetesAtom);
  const objectAtom = kubernetes[gvk];
  const [objects, setObjects] = useAtom(objectAtom);

  useEffect(() => {
    const interval = setInterval(() => {
      const operations = PENDING_CHANGES.
        filter((operation) => `${operation.object.apiVersion}/${operation.object.kind}` === gvk);

      operations.forEach((operation) => {
        const { type, object } = operation;
        const { metadata } = object;
        const nn = metadata.namespace ? `${metadata.namespace}/${metadata.name}` : metadata.name;

        switch (type) {
          case 'UPSERT':
            objects[nn] = object;
            break;
          case 'DELETE':
            delete objects[nn];
            break;
        }
      });

      setObjects({ ...objects });
    }, DEBOUNCE_MS);
    return () => clearInterval(interval);
  }, [objects, setObjects, gvk])
}
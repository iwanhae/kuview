import type { GVK, KubernetesObject, KuviewObjectType } from "@/lib/kuview";
import { kubernetesAtom } from "@/lib/kuviewAtom";
import { atom, useAtomValue } from "jotai";

export function useKuview<T extends GVK>(gvk: T): Record<string, KuviewObjectType<T>> {
  const kubernetes = useAtomValue(kubernetesAtom);
  if (!kubernetes[gvk]) {
    kubernetes[gvk] = atom<Record<string, KubernetesObject>>({});
  }
  return useAtomValue(kubernetes[gvk]) as Record<string, KuviewObjectType<T>>;
}


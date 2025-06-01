import type { KubernetesObject } from "@/lib/kuview";
import { kubernetesAtom } from "@/lib/kuviewAtom";
import { atom, useAtomValue } from "jotai";

export function useKuview(gvk: string): Record<string, KubernetesObject> {
  const kubernetes = useAtomValue(kubernetesAtom);
  if (!kubernetes[gvk]) {
    kubernetes[gvk] = atom<Record<string, KubernetesObject>>({});
  }
  return useAtomValue(kubernetes[gvk]);
}


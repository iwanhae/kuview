import type { GVK, KubernetesObject, KuviewObjectType } from "@/lib/kuview";
import { kubernetesAtom } from "@/lib/kuviewAtom";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

const tmpAtom = atom<Record<string, KubernetesObject>>({});

export function useKuview<T extends GVK>(gvk: T): Record<string, KuviewObjectType<T>> {
  const [kubernetes, setKubernetes] = useAtom(kubernetesAtom);

  useEffect(() => {
    if (!kubernetes[gvk]) {
      kubernetes[gvk] = atom<Record<string, KubernetesObject>>({});
    }
    setKubernetes({ ...kubernetes })
  }, [])


  return useAtomValue(kubernetes[gvk] ?? tmpAtom) as Record<string, KuviewObjectType<T>>;
}


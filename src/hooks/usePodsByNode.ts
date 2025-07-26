import { useAtomValue } from "jotai";
import { podsByNodeNameIndexAtom } from "@/lib/kuviewAtom";
import { useMemo } from "react";
import type { PodObject } from "@/lib/kuview";
import { useKuview } from "@/hooks/useKuview";

export function usePodsByNode(nodeName: string | undefined): PodObject[] {
  const allPods = useKuview("v1/Pod");
  const podsByNodeIndex = useAtomValue(podsByNodeNameIndexAtom);

  return useMemo(() => {
    if (!nodeName || !podsByNodeIndex[nodeName]) {
      return [];
    }

    const podKeys = Object.keys(podsByNodeIndex[nodeName]);
    return podKeys.map((key) => allPods[key]).filter(Boolean);
  }, [allPods, podsByNodeIndex, nodeName]);
}

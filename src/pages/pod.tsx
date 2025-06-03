import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import type { PodObject } from "@/lib/kuview";
import { podStatus } from "@/lib/status";

export default function PodPage() {
  const podsData = useKuview("v1/Pod") as Record<string, PodObject>;
  const [selectedPod, setSelectedPod] = useState<PodObject | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Pods</h1>
      </div>

      {/* Search */}
      <SearchComponent<PodObject>
        resources={Object.values(podsData)}
        getResourceId={(po) => `${po.metadata.namespace}/${po.metadata.name}`}
        getResourceStatus={podStatus}
        onResourceSelect={(id) => setSelectedPod(podsData[id] || null)}
        selectedResourceId={`${selectedPod?.metadata.namespace}/${selectedPod?.metadata.name}`}
        resourceTypeName="pod"
        urlResourceParam="pod"
        urlFilterParam="podFilter"
      />
      {/* TODO: Add display for the selectedPod details if needed */}
    </div>
  );
}

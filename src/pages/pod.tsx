import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import PodDetail from "@/components/block/pod-detail";
import type { PodObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function PodPage() {
  const podsData = useKuview("v1/Pod");
  const [selectedPod, setSelectedPod] = useState<PodObject | null>(null);

  return (
    <div className="flex 2xl:flex-row flex-col w-full justify-evenly gap-6 p-4 pt-0">
      {/* Left Panel - Pod List */}
      <div className="flex flex-col gap-6 w-full 2xl:w-1/2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Pods</h1>
        </div>

        {/* Search */}
        <SearchComponent<PodObject>
          resources={Object.values(podsData)}
          getResourceId={(po) => `${po.metadata.namespace}/${po.metadata.name}`}
          getResourceStatus={getStatus}
          onResourceSelect={(id) => setSelectedPod(podsData[id] || null)}
          selectedResourceId={`${selectedPod?.metadata.namespace}/${selectedPod?.metadata.name}`}
          resourceTypeName="pod"
          urlResourceParam="pod"
          urlFilterParam="podFilter"
        />
      </div>

      {/* Right Panel - Pod Detail */}
      {selectedPod && (
        <PodDetail pod={selectedPod} className="w-full 2xl:w-1/2" />
      )}
    </div>
  );
}

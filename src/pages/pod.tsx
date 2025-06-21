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
    <div className="grid grid-cols-1 xl:grid-cols-2">
      {/* Left Panel - Pod List */}
      <div className="flex flex-col gap-6 w-full px-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Pods</h1>
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
      {selectedPod && <PodDetail pod={selectedPod} className="w-full px-3" />}
    </div>
  );
}

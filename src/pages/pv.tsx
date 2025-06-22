import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import PVDetail from "@/components/block/pv-detail";
import type { PersistentVolumeObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function PVPage() {
  const pvs = useKuview("v1/PersistentVolume");
  const [selectedPV, setSelectedPV] = useState<PersistentVolumeObject | null>(
    null,
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2">
      {/* Left Panel - PV List */}
      <div className="flex flex-col gap-6 w-full px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Persistent Volumes</h1>
        </div>

        {/* Search */}
        <SearchComponent<PersistentVolumeObject>
          resources={Object.values(pvs)}
          getResourceId={(pv) => pv.metadata.name}
          getResourceStatus={getStatus}
          onResourceSelect={(id) => setSelectedPV(pvs[id] || null)}
          selectedResourceId={selectedPV?.metadata.name}
          resourceTypeName="persistent volume"
          urlResourceParam="pv"
          urlFilterParam="pvFilter"
        />
      </div>

      {/* Right Panel - PV Detail */}
      {selectedPV && <PVDetail pv={selectedPV} className="w-full px-4" />}
    </div>
  );
}

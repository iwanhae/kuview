import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import PVCDetail from "@/components/block/pvc-detail";
import type { PersistentVolumeClaimObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function PVCPage() {
  const pvcs = useKuview("v1/PersistentVolumeClaim");
  const [selectedPVC, setSelectedPVC] =
    useState<PersistentVolumeClaimObject | null>(null);

  return (
    <div className="flex xl:flex-row flex-col w-full justify-evenly gap-6 p-4 pt-0">
      {/* Left Panel - PVC List */}
      <div className="flex flex-col gap-6 w-full xl:w-1/2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Persistent Volume Claims</h1>
        </div>

        {/* Search */}
        <SearchComponent<PersistentVolumeClaimObject>
          resources={Object.values(pvcs)}
          getResourceId={(pvc) =>
            `${pvc.metadata.namespace}/${pvc.metadata.name}`
          }
          getResourceStatus={(pvc) => getStatus(pvc)}
          onResourceSelect={(id) => setSelectedPVC(pvcs[id] || null)}
          selectedResourceId={`${selectedPVC?.metadata.namespace}/${selectedPVC?.metadata.name}`}
          resourceTypeName="persistent volume claim"
          urlResourceParam="pvc"
          urlFilterParam="pvcFilter"
        />
      </div>

      {/* Right Panel - PVC Detail */}
      {selectedPVC && (
        <PVCDetail pvc={selectedPVC} className="w-full xl:w-1/2" />
      )}
    </div>
  );
}

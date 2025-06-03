import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import PodSearch from "@/components/block/pod-search";

interface Pod {
  metadata: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export default function Node() {
  const pods = useKuview("v1/Pod");
  const [pod, setPod] = useState<Pod | null>(null);

  const handlePodSelect = (podName: string) => {
    setPod(pods[podName]);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Pods</h1>
      </div>

      {/* Node Search and Selection */}
      <PodSearch
        pods={Object.values(pods)}
        onPodSelect={handlePodSelect}
        selectedPodNN={`${pod?.metadata.namespace}/${pod?.metadata.name}`}
      />
    </div>
  );
}

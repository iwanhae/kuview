import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import NamespaceDetail from "@/components/block/namespace-detail";
import type { NamespaceObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function NamespacePage() {
  const namespacesData = useKuview("v1/Namespace");
  const [selectedNamespace, setSelectedNamespace] =
    useState<NamespaceObject | null>(null);

  return (
    <div className="flex 2xl:flex-row flex-col w-full justify-evenly gap-6 p-4 pt-0">
      {/* Left Panel - Namespace List */}
      <div className="flex flex-col gap-6 w-full 2xl:w-1/2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Namespaces</h1>
        </div>

        {/* Search */}
        <SearchComponent<NamespaceObject>
          resources={Object.values(namespacesData)}
          getResourceId={(ns) => ns.metadata.name}
          getResourceStatus={getStatus}
          onResourceSelect={(id) =>
            setSelectedNamespace(namespacesData[id] || null)
          }
          selectedResourceId={selectedNamespace?.metadata.name}
          resourceTypeName="namespace"
          urlResourceParam="namespace"
          urlFilterParam="namespaceFilter"
        />
      </div>

      {/* Right Panel - Namespace Detail */}
      {selectedNamespace && (
        <NamespaceDetail
          namespace={selectedNamespace}
          className="w-full 2xl:w-1/2"
        />
      )}
    </div>
  );
}

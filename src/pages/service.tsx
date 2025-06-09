import { useKuview } from "@/hooks/useKuview";
import { useState } from "react";
import SearchComponent from "@/components/block/search";
import ServiceDetail from "@/components/block/service-detail";
import type { ServiceObject } from "@/lib/kuview";
import { getStatus } from "@/lib/status";

export default function ServicePage() {
  const servicesData = useKuview("v1/Service");
  const [selectedService, setSelectedService] = useState<ServiceObject | null>(
    null,
  );

  return (
    <div className="flex 2xl:flex-row flex-col w-full justify-evenly gap-6 p-4 pt-0">
      {/* Left Panel - Service List */}
      <div className="flex flex-col gap-6 w-full 2xl:w-1/2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Services</h1>
        </div>

        {/* Search */}
        <SearchComponent<ServiceObject>
          resources={Object.values(servicesData)}
          getResourceId={(service) =>
            `${service.metadata.namespace}/${service.metadata.name}`
          }
          getResourceStatus={(service) => getStatus(service)}
          onResourceSelect={(id) =>
            setSelectedService(servicesData[id] || null)
          }
          selectedResourceId={`${selectedService?.metadata.namespace}/${selectedService?.metadata.name}`}
          resourceTypeName="service"
          urlResourceParam="service"
          urlFilterParam="serviceFilter"
        />
      </div>

      {/* Right Panel - Service Detail */}
      {selectedService && (
        <ServiceDetail service={selectedService} className="w-full 2xl:w-1/2" />
      )}
    </div>
  );
}

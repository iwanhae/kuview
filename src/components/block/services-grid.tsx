import type { ServiceObject } from "@/lib/kuview";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusColor, getStatus } from "@/lib/status";
import { PREFIX } from "@/lib/const";
import { useLocation } from "wouter";

interface ServicesGridProps {
  title?: string;
  services: ServiceObject[];
}

const getServiceColor = (service: ServiceObject) => {
  const status = getStatus(service);
  return getStatusColor(status.status);
};

const SERVICES_PER_PAGE = 100;

export default function ServicesGrid({ title, services }: ServicesGridProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(services.length / SERVICES_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVICES_PER_PAGE;
  const endIndex = startIndex + SERVICES_PER_PAGE;
  const currentServices = services.slice(startIndex, endIndex);
  const shouldShowPagination = services.length > SERVICES_PER_PAGE;

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="gap-3 pt-3 pb-5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title || "Services"} ({services.length})
          {shouldShowPagination && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-0.5">
            <TooltipProvider>
              {currentServices.map((service) => {
                const status = getStatus(service);

                return (
                  <Tooltip
                    key={`${service.metadata.namespace}/${service.metadata.name}`}
                  >
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 cursor-pointer border border-gray-300 hover:border-gray-600 ${getServiceColor(service)}`}
                        onClick={() => {
                          const serviceId = `${service.metadata.namespace}/${service.metadata.name}`;
                          setLocation(
                            `${PREFIX}/services?service=${encodeURIComponent(serviceId)}`,
                          );
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{service.metadata.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Namespace: {service.metadata.namespace}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Type: {service.spec.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {status.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {status.reason}
                        </p>
                        {service.spec.ports &&
                          service.spec.ports.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Ports:{" "}
                              {service.spec.ports.map((p) => p.port).join(", ")}
                            </p>
                          )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
          {services.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No services in this namespace
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

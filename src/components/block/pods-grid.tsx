import type { PodObject } from "@/lib/kuview";
import { getStatusColor, getStatus, STATUS_ORDER } from "@/lib/status";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PREFIX } from "@/lib/const";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PodsGridProps {
  title?: string;
  pods: PodObject[];
}

const getPodColor = (pod: PodObject) => getStatusColor(getStatus(pod).status);
const PODS_PER_PAGE = 100;

export default function PodsGrid({ title, pods }: PodsGridProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(pods.length / PODS_PER_PAGE);
  const startIndex = (currentPage - 1) * PODS_PER_PAGE;
  const endIndex = startIndex + PODS_PER_PAGE;
  const currentPods = pods.slice(startIndex, endIndex);
  const shouldShowPagination = pods.length > PODS_PER_PAGE;

  const internalHandlePodClick = (pod: PodObject) => {
    const podId = `${pod.metadata.namespace}/${pod.metadata.name}`;
    setLocation(`${PREFIX}/pods?pod=${encodeURIComponent(podId)}`);
  };

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
          {title || "Pods"} ({pods.length})
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
              {currentPods
                .sort(
                  (a, b) =>
                    STATUS_ORDER.indexOf(getStatus(a).status) -
                    STATUS_ORDER.indexOf(getStatus(b).status),
                )
                .map((pod) => (
                  <Tooltip
                    key={`${pod.metadata.namespace}/${pod.metadata.name}`}
                  >
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 cursor-pointer border border-gray-300 hover:border-gray-600 transition-all  ${getPodColor(pod)}`}
                        onClick={() => internalHandlePodClick(pod)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{pod.metadata.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Namespace: {pod.metadata.namespace}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {getStatus(pod).status}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </TooltipProvider>
          </div>
          {pods.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No pods running on this node
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

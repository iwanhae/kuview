import type { ChartConfig } from "@/components/ui/chart";

export const cpuChartConfig = {
  percentage: {
    label: "Percentage",
  },
  requests: {
    label: "Requests",
    color: "#93c5fd",
  },
  limits: {
    label: "Limits",
    color: "#60a5fa",
  },
  usage: {
    label: "Usage",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export const memoryChartConfig = {
  percentage: {
    label: "Percentage",
  },
  requests: {
    label: "Requests",
    color: "#a7f3d0",
  },
  limits: {
    label: "Limits",
    color: "#6ee7b7",
  },
  usage: {
    label: "Usage",
    color: "#34d399",
  },
} satisfies ChartConfig;

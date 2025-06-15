import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ChartConfig } from "@/components/ui/chart";
import type { ResourceData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse Kubernetes CPU value to millicores
 * Examples: "100m" -> 100, "0.1" -> 100, "1" -> 1000, "1000n" -> 1
 */
export function parseCpu(value: string): number {
  if (!value) return 0;

  if (value.endsWith("m")) {
    return parseInt(value.slice(0, -1), 10);
  }

  if (value.endsWith("n")) {
    return Math.ceil(parseInt(value.slice(0, -1), 10) / 1000_000);
  }

  return Math.round(parseFloat(value) * 1000);
}

/**
 * Parse Kubernetes memory value to bytes
 * Examples: "128Mi" -> 134217728, "1Gi" -> 1073741824, "1000M" -> 1000000000
 */
export function parseMemory(value: string): number {
  if (!value) return 0;

  const units: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 * 1024,
    Gi: 1024 * 1024 * 1024,
    Ti: 1024 * 1024 * 1024 * 1024,
    K: 1000,
    M: 1000 * 1000,
    G: 1000 * 1000 * 1000,
    T: 1000 * 1000 * 1000 * 1000,
  };

  const match = value.match(/^(\d+(?:\.\d+)?)([KMGT]i?)?$/);
  if (!match) return 0;

  const [, numStr, unit] = match;
  const num = parseFloat(numStr);

  if (!unit) return num;

  return Math.round(num * (units[unit] || 1));
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number | string): string {
  if (typeof bytes === "string") {
    bytes = parseMemory(bytes);
  }

  const sizes = ["B", "Ki", "Mi", "Gi", "Ti"];
  if (bytes === 0) return "0 B";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedValue = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${formattedValue} ${sizes[i]}`;
}

/**
 * Format millicores to human readable string
 */
export function formatCpu(millicores: number): string {
  if (millicores < 1000) {
    return `${millicores}m`;
  }
  return `${(millicores / 1000).toFixed(1)}`;
}

export function generateChartData(
  capacity: number,
  resources: {
    requests: number;
    limits: number;
    usage?: number;
  },
  chartConfig: ChartConfig,
): ResourceData[] {
  const data: ResourceData[] = [];
  const types: (keyof typeof resources)[] = ["requests", "limits", "usage"];

  types.forEach((type) => {
    const value = resources[type];
    if (value !== undefined && value > 0) {
      const configEntry = chartConfig[type];
      if (
        configEntry &&
        typeof configEntry !== "string" &&
        "color" in configEntry &&
        configEntry.color
      ) {
        data.push({
          type: type,
          value: value,
          percentage:
            capacity > 0 ? Math.min((value / capacity) * 100, 100) : 0,
          fill: configEntry.color,
        });
      }
    }
  });

  return data;
}

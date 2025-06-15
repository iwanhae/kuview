import type { Metadata } from "./types";

export interface NodeMetricsObject {
  kind: "NodeMetrics";
  apiVersion: "metrics.k8s.io/v1beta1";
  metadata: Metadata;
  timestamp: string;
  window: string;
  usage: MetricsUsage;
}

export interface PodMetricsObject {
  kind: "PodMetrics";
  apiVersion: "metrics.k8s.io/v1beta1";
  metadata: Metadata;
  timestamp: string;
  window: string;
  containers: PodMetricsContainer[];
}

export interface PodMetricsContainer {
  name: string;
  usage: MetricsUsage;
}

export interface MetricsUsage {
  // e.g., 470087n
  cpu: string;
  // e.g., 76012Ki
  memory: string;
}

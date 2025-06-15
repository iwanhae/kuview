import type { EndpointSliceObject } from "./endpoint";
import type { KubernetesObject, Metadata, KuviewExtra } from "./types";

export interface ServiceObject extends KubernetesObject {
  kind: "Service";
  apiVersion: "v1";
  metadata: Metadata;
  spec: ServiceSpec;
  status: ServiceStatus;

  kuviewExtra?: KuviewExtra & {
    endpointSlices: Record<string /* EndpointSliceUID */, EndpointSliceObject>;
  };
}

interface ServiceSpec {
  type?: string;
  ports?: ServicePort[];
  selector?: Record<string, string>;
  clusterIP?: string;
  externalIPs?: string[];
}

interface ServiceStatus {
  loadBalancer?: {
    ingress?: Array<{ ip?: string; hostname?: string }>;
  };
}

interface ServicePort {
  name?: string;
  port: number;
  targetPort?: number | string;
  protocol?: string;
  nodePort?: number;
}

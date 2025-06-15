import type { KubernetesObject, Metadata, ObjectReference } from "./types";

export interface EndpointSliceObject extends KubernetesObject {
  kind: "EndpointSlice";
  apiVersion: "discovery.k8s.io/v1";
  metadata: Metadata;
  addressType: "IPv4" | "IPv6" | "FQDN";
  endpoints?: Endpoint[];
  ports?: EndpointPort[];
}

export interface Endpoint {
  addresses: string[];
  conditions?: EndpointConditions;
  hostname?: string;
  nodeName?: string;
  targetRef?: ObjectReference;
  zone?: string;
}

interface EndpointConditions {
  ready: boolean;
  serving: boolean;
  terminating: boolean;
}

interface EndpointPort {
  name?: string;
  port: number;
  protocol?: "TCP" | "UDP" | "SCTP";
  appProtocol?: string;
}

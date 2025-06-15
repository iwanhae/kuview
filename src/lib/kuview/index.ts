// Re-export all types from sub-modules
export * from "./types";
export * from "./pod";
export * from "./service";
export * from "./node";
export * from "./endpoint";
export * from "./namespace";

// Import specific types for the object map
import type { PodObject } from "./pod";
import type { ServiceObject } from "./service";
import type { NodeObject } from "./node";
import type { EndpointSliceObject } from "./endpoint";
import type { NamespaceObject } from "./namespace";

export interface KuviewObjectMap {
  "v1/Pod": PodObject;
  "v1/Service": ServiceObject;
  "v1/Node": NodeObject;
  "v1/Namespace": NamespaceObject;
  "discovery.k8s.io/v1/EndpointSlice": EndpointSliceObject;
}

export type GVK = keyof KuviewObjectMap;

export type KuviewObjectType<T extends GVK> = KuviewObjectMap[T];

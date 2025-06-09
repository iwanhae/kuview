import { atom, useAtom, useAtomValue, type PrimitiveAtom } from "jotai";
import type {
  EndpointSliceObject,
  KubernetesObject,
  KuviewEvent,
  KuviewExtra,
  ServiceObject,
} from "./kuview";
import { useEffect } from "react";
import { calcStatus } from "./status";

const DEBOUNCE_MS = 100;

export const kubernetesAtom = atom<
  Record<string /* GroupVersionKind */, ObjectAtom>
>({
  "v1/Service": atom<Record<string, KubernetesObject>>({}),
  "discovery.k8s.io/v1/EndpointSlice": atom<Record<string, KubernetesObject>>(
    {},
  ),
});

type ObjectAtom = PrimitiveAtom<
  Record<string /* NamespaceName */, KubernetesObject>
>;

type _change_operation = {
  type: "UPSERT" | "DELETE";
  object: KubernetesObject;
};

const PENDING_CHANGES: _change_operation[] = [];

export function handleEvent(event: KuviewEvent) {
  switch (event.type) {
    case "create":
    case "update":
    case "generic":
      PENDING_CHANGES.push({ type: "UPSERT", object: event.object });
      break;
    case "delete":
      PENDING_CHANGES.push({ type: "DELETE", object: event.object });
      break;
  }
}

export function useGVKSyncHook(gvk: string) {
  const kubernetes = useAtomValue(kubernetesAtom);
  const objectAtom = kubernetes[gvk];
  const [objects, setObjects] = useAtom(objectAtom);

  const sync = () => {
    const operations = PENDING_CHANGES.filter(
      (operation) =>
        `${operation.object.apiVersion}/${operation.object.kind}` === gvk,
    );
    if (operations.length == 0) return;

    operations.forEach((operation) => {
      const { type, object } = operation;
      const { metadata } = object;
      const nn = metadata.namespace
        ? `${metadata.namespace}/${metadata.name}`
        : metadata.name;

      if (type === "UPSERT") object.kuviewExtra = { ...calcStatus(object) };

      switch (type) {
        case "UPSERT":
          objects[nn] = object;
          break;
        case "DELETE":
          delete objects[nn];
          break;
      }
    });

    for (const operation of operations) {
      const index = PENDING_CHANGES.findIndex(
        (o) => o.object.metadata.uid === operation.object.metadata.uid,
      );
      if (index !== -1) {
        PENDING_CHANGES.splice(index, 1);
      }
    }

    setObjects({ ...objects });
  };

  useEffect(() => {
    const interval = setInterval(sync, DEBOUNCE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// useKubernetesAtomSyncHook defines a new GVK atom if it doesn't exist in kubernetesAtom but is in PENDING_CHANGES
export function useKubernetesAtomSyncHook() {
  const [kubernetes, setKubernetes] = useAtom(kubernetesAtom);
  useEffect(() => {
    const interval = setInterval(() => {
      for (const operation of PENDING_CHANGES) {
        const { object } = operation;
        const { kind, apiVersion } = object;
        const gvk = `${apiVersion}/${kind}`;
        if (!kubernetes[gvk]) {
          console.warn("FINDS_UNHANDLED_NEW_GVK", gvk);
          setKubernetes({
            ...kubernetes,
            [gvk]: atom<Record<string, KubernetesObject>>({}),
          });
          return;
        }
      }
    }, 10_000); // 10 seconds
    return () => clearInterval(interval);
  }, [kubernetes, setKubernetes]);
}

// useServiceEndpointSliceSyncHook is a exceptional sync hook that handles both of service and endpointslice resources
// As they are related to each other, finding each other is a bit computationally expensive
// Primary purpose of this hook is to add endpointSlices to its owner service (.kuviewExtra.endpointSlices)
export function useServiceEndpointSliceSyncHook() {
  const kubernetes = useAtomValue(kubernetesAtom);

  const serviceAtom = kubernetes["v1/Service"];
  const [services, setServices] = useAtom(serviceAtom);

  const endpointSliceAtom = kubernetes["discovery.k8s.io/v1/EndpointSlice"];
  const [endpointSlices, setEndpointSlices] = useAtom(endpointSliceAtom);

  const sync = () => {
    // 1. find all operations that are related to services and endpoint slices
    const operations = PENDING_CHANGES.filter(
      (operation) =>
        operation.object.kind === "Service" ||
        operation.object.kind === "EndpointSlice",
    );

    // 2. update services first
    const serviceOperations = operations.filter(
      (operation) => operation.object.kind === "Service",
    );
    serviceOperations.forEach((operation) => {
      const { object } = operation;
      const { metadata } = object;
      const nn = `${metadata.namespace}/${metadata.name}`;

      if (operation.type === "UPSERT") {
        if (!services[nn]) services[nn] = object;
        else
          services[nn] = {
            ...object,
            kuviewExtra: services[nn].kuviewExtra,
          };
      } else if (operation.type === "DELETE") {
        delete services[nn];
      }
    });

    // 3. update endpoint slices
    const endpointSliceOperations = operations.filter(
      (operation) => operation.object.kind === "EndpointSlice",
    );
    endpointSliceOperations.forEach((operation) => {
      const { object } = operation;
      const { metadata } = object;
      const nn = `${metadata.namespace}/${metadata.name}`;

      if (operation.type === "UPSERT") {
        endpointSlices[nn] = object;
      } else if (operation.type === "DELETE") {
        delete endpointSlices[nn];
      }
    });

    // 4. insert endpointSlices to services
    for (const ep of Object.values(endpointSlices) as EndpointSliceObject[]) {
      // find owner reference
      const ownerRef = ep.metadata.ownerReferences?.find(
        // owner of endpoint slice can be either endpoints or service
        // either way, name of owner is the same as the name of service
        (o) => o.kind === "Endpoints" || o.kind === "Service",
      );
      if (!ownerRef) continue;
      const nn = `${ep.metadata.namespace}/${ownerRef.name}`;

      // find owner service
      const ownerService = services[nn] as ServiceObject;
      if (!ownerService) continue;

      // insert endpoint slice to service
      ownerService.kuviewExtra = {
        endpointSlices: {},
      } as KuviewExtra & {
        endpointSlices: Record<string, EndpointSliceObject>;
      };
      ownerService.kuviewExtra.endpointSlices[ep.metadata.uid] = ep;
    }

    // 5. update status of services
    for (const service of Object.values(services) as ServiceObject[]) {
      const condition = calcStatus(service);
      if (service.kuviewExtra) {
        service.kuviewExtra.status = condition.status;
        service.kuviewExtra.reason = condition.reason;
      } else {
        service.kuviewExtra = {
          status: condition.status,
          reason: condition.reason,
          endpointSlices: {},
        };
      }
    }

    // 6. remove operations from PENDING_CHANGES
    for (const operation of operations) {
      const index = PENDING_CHANGES.findIndex(
        (o) => o.object.metadata.uid === operation.object.metadata.uid,
      );
      if (index !== -1) PENDING_CHANGES.splice(index, 1);
    }

    setServices({ ...services });
    setEndpointSlices({ ...endpointSlices });
  };

  useEffect(() => {
    const interval = setInterval(sync, DEBOUNCE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

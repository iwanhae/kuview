import { atom, useAtom, useAtomValue, type PrimitiveAtom } from "jotai";
import type {
  EndpointSliceObject,
  KubernetesObject,
  KuviewEvent,
  KuviewExtra,
  ServiceObject,
  PodObject,
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
  "kuview.iwanhae.kr/v1/UserGroup": atom<Record<string, KubernetesObject>>({}), // virtual resource
});

// Pod index atom: nodeName -> pod nn -> true
export const podsByNodeNameIndexAtom = atom<
  Record<string, Record<string, true>>
>({});

type ObjectAtom = PrimitiveAtom<
  Record<string /* NamespaceName */, KubernetesObject>
>;

type _change_operation = {
  type: "UPSERT" | "DELETE";
  object: KubernetesObject;
};

const PENDING_CHANGES = new Map<string, _change_operation>();

// A dedicated queue for Pod index changes
type PodIndexChange = {
  type: "DELETE" | "UPSERT";
  pod: PodObject;
};

const POD_INDEX_CHANGES = new Map<string, PodIndexChange>();

function getObjectKey(object: KubernetesObject): string {
  // it is suprising that sometimes the uid is not unique, so we need to check the apiVersion and kind as well
  return `${object.apiVersion}/${object.kind}:${object.metadata.namespace}/${object.metadata.name}:${object.metadata.uid}`;
}

// Function to update the Pod index
function updatePodIndex(event: KuviewEvent) {
  if (event.object.kind !== "Pod" || event.object.apiVersion !== "v1") {
    return;
  }

  const pod = event.object as PodObject;
  const nodeName = pod.spec?.nodeName;
  const nn = pod.metadata.namespace
    ? `${pod.metadata.namespace}/${pod.metadata.name}`
    : pod.metadata.name;

  // If nodeName doesn't exist, no need to index, so drop it here
  if (!nodeName || !nn) {
    return;
  }

  POD_INDEX_CHANGES.set(nn, {
    type: event.type === "delete" ? "DELETE" : "UPSERT",
    pod,
  });
}

export function handleEvent(event: KuviewEvent) {
  // Update Pod index (handled separately from the main logic)
  updatePodIndex(event);

  const key = getObjectKey(event.object);
  switch (event.type) {
    case "create":
    case "update":
    case "generic":
      PENDING_CHANGES.set(key, { type: "UPSERT", object: event.object });
      break;
    case "delete":
      PENDING_CHANGES.set(key, { type: "DELETE", object: event.object });
      break;
  }
}

export function useGVKSyncHook(gvk: string) {
  const kubernetes = useAtomValue(kubernetesAtom);
  const objectAtom = kubernetes[gvk];
  const [objects, setObjects] = useAtom(objectAtom);

  const sync = () => {
    const operations: _change_operation[] = [];
    PENDING_CHANGES.forEach((op, key) => {
      if (`${op.object.apiVersion}/${op.object.kind}` === gvk) {
        operations.push(op);
        PENDING_CHANGES.delete(key);
      }
    });

    if (operations.length === 0) return;

    let updated = false;

    operations.forEach((operation) => {
      updated = true;
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

    if (updated) {
      console.log("updated", gvk, operations);
      setObjects({ ...objects });
    }
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
      for (const operation of PENDING_CHANGES.values()) {
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
    const operations: _change_operation[] = [];
    PENDING_CHANGES.forEach((op, key) => {
      if (op.object.kind === "Service" || op.object.kind === "EndpointSlice") {
        operations.push(op);
        PENDING_CHANGES.delete(key);
      }
    });

    if (operations.length === 0) return;

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

    setServices({ ...services });
    setEndpointSlices({ ...endpointSlices });
  };

  useEffect(() => {
    const interval = setInterval(sync, DEBOUNCE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// usePodIndexSyncHook: A hook to update the Pod index in real-time
export function usePodIndexSyncHook() {
  const [podIndex, setPodIndex] = useAtom(podsByNodeNameIndexAtom);

  const sync = () => {
    const changes: PodIndexChange[] = [];
    POD_INDEX_CHANGES.forEach((change, nn) => {
      changes.push(change);
      POD_INDEX_CHANGES.delete(nn);
    });

    if (changes.length === 0) return;

    let updated = false;

    changes.forEach((change) => {
      const { type, pod } = change;
      const nodeName = pod.spec.nodeName!; // From here, we assume nodeName always exists
      const nn = pod.metadata.namespace
        ? `${pod.metadata.namespace}/${pod.metadata.name}`
        : pod.metadata.name;

      if (type === "DELETE") {
        if (podIndex[nodeName] && podIndex[nodeName][nn]) {
          const updatedNodePods = { ...podIndex[nodeName] };
          delete updatedNodePods[nn];
          if (Object.keys(updatedNodePods).length === 0) {
            delete podIndex[nodeName];
          } else {
            podIndex[nodeName] = updatedNodePods;
          }
          updated = true;
        }
      } else {
        // UPSERT
        if (!podIndex[nodeName]) {
          podIndex[nodeName] = {};
        }
        podIndex[nodeName] = {
          ...podIndex[nodeName],
          [nn]: true,
        };
        updated = true;
      }
    });

    if (updated) {
      console.log("Updated Pod index", changes.length, "operations");
      setPodIndex({ ...podIndex });
    }
  };

  useEffect(() => {
    const interval = setInterval(sync, DEBOUNCE_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

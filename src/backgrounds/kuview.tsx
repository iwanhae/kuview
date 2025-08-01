import type { KuviewEvent } from "@/lib/kuview";
import {
  handleEvent,
  kubernetesAtom,
  useGVKSyncHook,
  useKubernetesAtomSyncHook,
  useServiceEndpointSliceSyncHook,
  usePodIndexSyncHook,
} from "@/lib/kuviewAtom";

import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { SyncUserGroup } from "./userGroup";

interface WindowWithKuview extends Window {
  kuview: (event: KuviewEvent) => void;
}

interface WindowWithKuviewQueue extends Window {
  kuviewEventQueue?: KuviewEvent[];
}

export default function KuviewBackground() {
  // Enqueue events from WASM published events
  useEffect(() => {
    console.log("[REACT] KuviewBackground mounted");
    // Process any queued events first
    const windowWithQueue = window as WindowWithKuviewQueue;
    if (
      windowWithQueue.kuviewEventQueue &&
      windowWithQueue.kuviewEventQueue.length > 0
    ) {
      console.log(
        "[REACT] Processing queued events:",
        windowWithQueue.kuviewEventQueue,
      );
      windowWithQueue.kuviewEventQueue.forEach((event) => handleEvent(event));
      windowWithQueue.kuviewEventQueue = []; // Clear the queue
    }

    // Set the actual event handler
    console.log("[REACT] Setting event handler");
    (window as unknown as WindowWithKuview).kuview = (event: KuviewEvent) => {
      handleEvent(event);
    };

    // Cleanup function to remove the event handler if the component unmounts
    return () => {
      (window as unknown as WindowWithKuview).kuview = (event: KuviewEvent) => {
        // Optionally, re-instate queueing or log if events are received after unmount
        console.log(
          "KuviewBackground unmounted, event received but not handled:",
          event,
        );
      };
    };
  }, []);

  return <SyncKubernetes />;
}

function SyncKubernetes() {
  useKubernetesAtomSyncHook();
  usePodIndexSyncHook(); // Added for Pod index synchronization
  const kubernetes = useAtomValue(kubernetesAtom);
  const gvks = Object.keys(kubernetes);
  const normalGVKs = gvks.filter(
    (gvk) =>
      gvk !== "v1/Service" && gvk !== "discovery.k8s.io/v1/EndpointSlice",
  );
  return (
    <>
      {normalGVKs.map((gvk) => (
        <SyncKubernetesGVK key={gvk} gvk={gvk} />
      ))}
      <SyncService />
      <SyncUserGroup />
    </>
  );
}

function SyncKubernetesGVK({ gvk }: { gvk: string }) {
  useGVKSyncHook(gvk);
  return <></>;
}

function SyncService() {
  useServiceEndpointSliceSyncHook();
  return <></>;
}

import type { KuviewEvent } from "@/lib/kuview";
import {
  handleEvent,
  useGVKSyncHook,
  useKubernetesSyncHook,
} from "@/lib/kuviewAtom";
import { useEffect } from "react";

interface DocumentWithKuview extends Document {
  kuview: (event: KuviewEvent) => void;
}

interface WindowWithKuviewQueue extends Window {
  kuviewEventQueue?: KuviewEvent[];
}

export default function KuviewBackground() {
  // Enqueue events from WASM published events
  useEffect(() => {
    // Process any queued events first
    const windowWithQueue = window as WindowWithKuviewQueue;
    if (
      windowWithQueue.kuviewEventQueue &&
      windowWithQueue.kuviewEventQueue.length > 0
    ) {
      console.log(
        "Processing queued events:",
        windowWithQueue.kuviewEventQueue,
      );
      windowWithQueue.kuviewEventQueue.forEach((event) => handleEvent(event));
      windowWithQueue.kuviewEventQueue = []; // Clear the queue
    }

    // Set the actual event handler
    (document as DocumentWithKuview).kuview = (event: KuviewEvent) => {
      handleEvent(event);
    };

    // Cleanup function to remove the event handler if the component unmounts
    return () => {
      (document as DocumentWithKuview).kuview = (event: KuviewEvent) => {
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
  // Sync Kubernetes objects from the server
  const gvks = useKubernetesSyncHook();
  return (
    <>
      {gvks.map((gvk) => (
        <SyncKubernetesGVK key={gvk} gvk={gvk} />
      ))}
    </>
  );
}

function SyncKubernetesGVK({ gvk }: { gvk: string }) {
  useGVKSyncHook(gvk);
  return <></>;
}

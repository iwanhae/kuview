import type { KuviewEvent } from "@/lib/kuview";
import { useEffect } from "react";

export default function KuviewBackground() {
  useEffect(() => {
    (document as any).kuview = (event: KuviewEvent) => {
      // TODO: Implement
    };
  }, []);

  return <></>;
}

import { useState, useEffect, useRef } from "react";
import type { PodObject, Container } from "@/lib/kuview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Terminal } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PodLogsProps {
  pod: PodObject;
}

type LogOption = "live" | "previous";

function LogContent({ url, follow }: { url: string; follow: boolean }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    const abortController = new AbortController();
    const decoder = new TextDecoder();

    const fetchStream = async () => {
      setLoading(true);
      setError(null);
      if (preRef.current) {
        preRef.current.textContent = "";
      }

      try {
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get reader from response body");
        }

        setLoading(false);
        let contentReceived = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!contentReceived && preRef.current) {
              preRef.current.textContent = "No logs available.";
            }
            break;
          }
          contentReceived = true;
          if (preRef.current) {
            preRef.current.textContent += decoder.decode(value, {
              stream: true,
            });
            if (follow) {
              preRef.current.scrollTop = preRef.current.scrollHeight;
            }
          }
        }
      } catch (e: unknown) {
        if ((e as Error).name === "AbortError") {
          return;
        }
        if (e instanceof Error) {
          setError(e);
        } else {
          setError(new Error(String(e)));
        }
        setLoading(false);
      }
    };

    fetchStream();

    return () => {
      abortController.abort();
    };
  }, [url, follow]);

  return (
    <>
      {loading && <div className="p-4">Loading logs...</div>}
      {error && (
        <div className="p-4 text-destructive">
          Error loading logs: {error.message}
        </div>
      )}
      <pre
        ref={preRef}
        className={cn(
          "text-xs bg-muted rounded-md overflow-auto font-mono h-full",
          {
            hidden: loading || error,
          },
        )}
      />
    </>
  );
}

export default function PodLogs({ pod }: PodLogsProps) {
  const [logOption, setLogOption] = useState<LogOption>("live");
  const [follow, setFollow] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<
    (Container & { type: string }) | null
  >(null);

  const getLogUrl = (containerName: string, option: LogOption) => {
    const namespace = pod.metadata.namespace;
    const name = pod.metadata.name;
    const follow = option === "live";
    const previous = option === "previous";
    return `/api/v1/namespaces/${namespace}/pods/${name}/log?container=${containerName}&follow=${follow}&previous=${previous}`;
  };

  const containers = pod.spec.containers || [];
  const initContainers = pod.spec.initContainers || [];
  const ephemeralContainers = pod.spec.ephemeralContainers || [];

  const allContainers = [
    ...containers.map((c: Container) => ({ ...c, type: "Standard" })),
    ...initContainers.map((c: Container) => ({ ...c, type: "Init" })),
    ...ephemeralContainers.map((c: Container) => ({
      ...c,
      type: "Ephemeral",
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={logOption}
          onValueChange={(value) => setLogOption(value as LogOption)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="live" id="live" />
            <Label htmlFor="live">Live</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="previous" id="previous" />
            <Label htmlFor="previous">Previous</Label>
          </div>
        </RadioGroup>

        <div className="grid grid-cols-2 gap-2">
          {allContainers.map((container) => (
            <div
              key={container.name}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => setSelectedContainer(container)}
            >
              <div>
                <p className="font-medium">{container.name}</p>
                <p className="text-sm text-muted-foreground">
                  {container.type} Container
                </p>
              </div>
              <Terminal className="w-4 h-4" />
            </div>
          ))}
        </div>

        <Drawer
          open={!!selectedContainer}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedContainer(null);
            }
          }}
        >
          <DrawerContent className="h-[80vh] flex flex-col">
            {selectedContainer && (
              <>
                <DrawerHeader className="flex justify-between items-center">
                  <DrawerTitle>
                    Logs: {pod.metadata.name}/{selectedContainer.name} (
                    {logOption})
                  </DrawerTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="follow"
                      checked={follow}
                      onCheckedChange={(checked) => setFollow(!!checked)}
                    />
                    <Label htmlFor="follow">Follow</Label>
                  </div>
                </DrawerHeader>
                <div className="flex-grow overflow-hidden px-4 pb-4">
                  <LogContent
                    url={getLogUrl(selectedContainer.name, logOption)}
                    follow={follow}
                  />
                </div>
              </>
            )}
          </DrawerContent>
        </Drawer>
      </CardContent>
    </Card>
  );
}

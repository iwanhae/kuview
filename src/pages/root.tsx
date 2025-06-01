import { useKuview } from "@/hooks/useKuview"; // Assuming path alias for hooks

export default function Root() {
  const nodes = useKuview("v1/Node");
  const nodeEntries = Object.entries(nodes);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-2">
            Nodes ({nodeEntries.length})
          </h2>
          {nodeEntries.length === 0 ? (
            <p className="text-sm text-gray-500">
              No nodes found or events not yet received.
            </p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {nodeEntries.map(([key, node]) => (
                <li key={key} className="text-sm">
                  {node.metadata.name}
                  {/* You can add more details here, e.g., node.metadata.labels?.['kubernetes.io/os'] */}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}

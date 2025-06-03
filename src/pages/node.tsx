import { useKuview } from "@/hooks/useKuview";
import { FixedSizeList as List } from "react-window";

export default function Node() {
  const nodes = useKuview("v1/Node");
  // const pods = useKuview("v1/Pod");

  const nodeEntries = Object.entries(nodes);

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => <div style={style}>{nodeEntries[index][1].metadata.name}</div>;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🖥️</span>
        <h1 className="text-2xl font-bold">Node Overview</h1>
      </div>

      {nodeEntries.length === 0 ? (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No nodes found or events not yet received.
          </p>
        </div>
      ) : (
        <>
          <List
            height={150}
            itemCount={nodeEntries.length}
            itemSize={35}
            width={600}
          >
            {Row}
          </List>
        </>
      )}
    </div>
  );
}

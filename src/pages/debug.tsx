import Treemap from "@/components/ui/treemap";

interface Item {
  name: string;
  value: number;
  href: string;
}

export default function Debug() {
  const sampleItems: Item[] = [
    { name: "Item A", value: 40, href: "/item-a" },
    { name: "Item B", value: 30, href: "/item-b" },
    { name: "Item C", value: 15, href: "/item-c" },
    { name: "Item D", value: 10, href: "/item-d" },
    { name: "Item E", value: 2, href: "/item-e" }, // Small
    { name: "Item F", value: 1, href: "/item-f" }, // Small
    { name: "Item G", value: 0.5, href: "/item-g" }, // Small
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Treemap Demo</h1>
      <Treemap items={sampleItems} width={600} height={600} />
    </div>
  );
}

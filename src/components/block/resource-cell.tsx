interface ResourceCellProps {
  used: number;
  capacity: number;
  percentage: number;
  formatValue: (value: number) => string;
  type: "requests" | "limits";
}

export default function ResourceCell({
  used,
  capacity,
  percentage,
  formatValue,
  type,
}: ResourceCellProps) {
  const getColorClass = (pct: number, resourceType: "requests" | "limits") => {
    if (resourceType === "limits") {
      if (pct > 100) return "text-red-600 bg-red-50";
      if (pct > 80) return "text-yellow-600 bg-yellow-50";
      return "text-green-600 bg-green-50";
    } else {
      if (pct > 80) return "text-green-600 bg-green-50";
      if (pct > 50) return "text-blue-600 bg-blue-50";
      return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className={`p-2 rounded text-xs ${getColorClass(percentage, type)}`}>
      <div className="font-medium">{formatValue(used)}</div>
      <div className="text-xs opacity-75">
        {percentage.toFixed(1)}% of {formatValue(capacity)}
      </div>
    </div>
  );
}

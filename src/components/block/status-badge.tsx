import { Status, STATUS_COLORS } from "@/lib/status";

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color.textColor} ${color.bgColor}`}
    >
      {status}
    </span>
  );
}

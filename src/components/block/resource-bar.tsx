interface ResourceBarProps {
  title: string;
  requests: number;
  limits: number;
  capacity: number;
  formatValue: (value: number) => string;
}

export default function ResourceBar({
  title,
  requests,
  limits,
  capacity,
  formatValue,
}: ResourceBarProps) {
  const requestsPercentage = capacity > 0 ? (requests / capacity) * 100 : 0;
  const limitsPercentage = capacity > 0 ? (limits / capacity) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">
          {formatValue(capacity)} total
        </span>
      </div>

      {/* Requests Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Requests</span>
          <span className="text-xs">
            {formatValue(requests)} ({requestsPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(requestsPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Limits Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Limits</span>
          <span className="text-xs">
            {formatValue(limits)} ({limitsPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              limitsPercentage > 100 ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(limitsPercentage, 100)}%` }}
          />
          {limitsPercentage > 100 && (
            <div className="text-xs text-red-500 mt-1">
              Overcommitted by {(limitsPercentage - 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

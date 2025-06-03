interface ClusterResourceBarProps {
  title: string;
  requests: number;
  limits: number;
  capacity: number;
  formatValue: (value: number) => string;
  nodeCount: number;
}

export default function ClusterResourceBar({
  title,
  requests,
  limits,
  capacity,
  formatValue,
  nodeCount,
}: ClusterResourceBarProps) {
  const requestsPercentage = capacity > 0 ? (requests / capacity) * 100 : 0;
  const limitsPercentage = capacity > 0 ? (limits / capacity) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{title}</span>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            {formatValue(capacity)} total across {nodeCount} nodes
          </div>
        </div>
      </div>

      {/* Requests Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Total Requests</span>
          <span className="text-xs font-medium">
            {formatValue(requests)} ({requestsPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(requestsPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Limits Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Total Limits</span>
          <span className="text-xs font-medium">
            {formatValue(limits)} ({limitsPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              limitsPercentage > 100
                ? "bg-red-500"
                : limitsPercentage > 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(limitsPercentage, 100)}%` }}
          />
        </div>
        {limitsPercentage > 100 && (
          <div className="text-xs text-red-600 mt-1 font-medium">
            ⚠️ Overcommitted by {(limitsPercentage - 100).toFixed(1)}%
          </div>
        )}
        {limitsPercentage > 80 && limitsPercentage <= 100 && (
          <div className="text-xs text-yellow-600 mt-1">
            ⚡ High usage: {limitsPercentage.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Usage Summary */}
      <div className="bg-muted p-2 rounded text-xs space-y-1">
        <div className="flex justify-between">
          <span>Avg per node:</span>
          <span>{formatValue(capacity / nodeCount || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Request efficiency:</span>
          <span
            className={
              requestsPercentage < 50 ? "text-yellow-600" : "text-green-600"
            }
          >
            {requestsPercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

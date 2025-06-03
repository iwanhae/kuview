import { Status } from "@/lib/status";

interface Props {
  resourceName: string;

  status: Record<Status, number>;
}

export default function CardResourceOverview(props: Props) {
  const running = props.status[Status.Running] || 0;
  const done = props.status[Status.Done] || 0;
  const warning = props.status[Status.Warning] || 0;
  const error = props.status[Status.Error] || 0;
  const pending = props.status[Status.Pending] || 0;
  const terminating = props.status[Status.Terminating] || 0;

  const total = running + done + warning + error + pending + terminating;

  const healthStats = [
    {
      label: "Running",
      value: running,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      percentage: total > 0 ? (running / total) * 100 : 0,
    },
    {
      label: "Pending",
      value: pending,
      color: "bg-gray-500",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      percentage: total > 0 ? (pending / total) * 100 : 0,
    },
    {
      label: "Terminating",
      value: terminating,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      percentage: total > 0 ? (terminating / total) * 100 : 0,
    },
    ...(done
      ? [
          {
            label: "Done",
            value: done,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
            textColor: "text-blue-700",
            percentage: total > 0 ? (done / total) * 100 : 0,
          },
        ]
      : []),
    {
      label: "Warning",
      value: warning,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      percentage: total > 0 ? (warning / total) * 100 : 0,
    },
    {
      label: "Error",
      value: error,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      percentage: total > 0 ? (error / total) * 100 : 0,
    },
  ];

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
            {props.resourceName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total: {total} resources
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {/* Status indicator */}
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              error > 0
                ? "bg-red-500"
                : warning > 0
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
          />
        </div>
      </div>

      {/* Color Legend */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            {healthStats
              .filter((stat) => stat.value > 0)
              .map((stat, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.label} ({stat.value})
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {total > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Health Overview
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {total} total
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="h-full flex">
              {healthStats.map(
                (stat, index) =>
                  stat.value > 0 && (
                    <div
                      key={index}
                      className={`${stat.color} transition-all duration-500 ease-out`}
                      style={{ width: `${stat.percentage}%` }}
                      title={`${stat.label}: ${stat.value}`}
                    />
                  ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

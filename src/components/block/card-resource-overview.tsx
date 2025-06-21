import { Status, STATUS_COLORS, OVERVIEW_STATUS_ORDER } from "@/lib/status";
import { Link } from "wouter";

interface Props {
  resourceName: string;
  href: string;
  status: Record<Status, number>;
}

export default function CardResourceOverview(props: Props) {
  const total = OVERVIEW_STATUS_ORDER.reduce(
    (acc, statusKey) => acc + (props.status[statusKey] || 0),
    0,
  );

  const healthStats = OVERVIEW_STATUS_ORDER.map((statusKey) => {
    const value = props.status[statusKey] || 0;
    const config = STATUS_COLORS[statusKey];
    return {
      label: statusKey.toString(),
      value,
      ...config,
      percentage: total > 0 ? (value / total) * 100 : 0,
    };
  });

  let indicatorColor: string = STATUS_COLORS[Status.Running].color; // Default to Running color

  if (total === 0) {
    indicatorColor = "bg-gray-300"; // Neutral color for no resources
  } else {
    let mostSevereActiveStatus: Status | null = null;
    let maxSeverity = -1;

    for (const s of Object.values(Status) as Status[]) {
      const value = props.status[s] || 0;
      if (value > 0) {
        const currentStatusConfig = STATUS_COLORS[s];
        if (currentStatusConfig && currentStatusConfig.severity > maxSeverity) {
          maxSeverity = currentStatusConfig.severity;
          mostSevereActiveStatus = s;
        }
      }
    }

    if (mostSevereActiveStatus) {
      const sevConfig = STATUS_COLORS[mostSevereActiveStatus];
      if (sevConfig.severity >= STATUS_COLORS[Status.Warning].severity) {
        indicatorColor = sevConfig.color;
      } else {
        indicatorColor = STATUS_COLORS[Status.Running].color;
      }
    }
    // If mostSevereActiveStatus is null but total > 0 (e.g. only 'Done' items),
    // it will keep the default Running color, which is fine.
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link href={props.href}>
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
              className={`w-2 h-2 rounded-full animate-pulse ${indicatorColor}`}
            />
          </div>
        </div>

        {/* Color Legend */}
        {total > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
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
      </Link>
    </div>
  );
}

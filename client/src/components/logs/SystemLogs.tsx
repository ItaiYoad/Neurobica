import { formatDistanceToNow } from "date-fns";
import { SystemLog } from "@/types";

interface SystemLogsProps {
  logs: SystemLog[];
  onViewAllLogs: () => void;
}

export function SystemLogs({ logs, onViewAllLogs }: SystemLogsProps) {
  // Get color based on log type
  const getLogColor = (type: string): string => {
    switch (type) {
      case "biometric":
        return "border-status-focused";
      case "memory":
        return "border-secondary";
      case "alert":
        return "border-status-alert";
      case "prompt":
        return "border-accent";
      default:
        return "border-gray-300";
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-4">
      <h2 className="font-semibold">Recent System Logs</h2>
      <div className="mt-3 space-y-2">
        {logs.length === 0 ? (
          <div className="text-xs text-neutral-mid italic">
            No logs available
          </div>
        ) : (
          logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className={`text-xs border-l-2 ${getLogColor(log.type)} pl-2 py-1`}
            >
              <div className="text-neutral-mid">
                {formatTime(log.timestamp)}
              </div>
              <div className="font-medium">{log.message}</div>
            </div>
          ))
        )}
      </div>

      <button
        className="mt-3 text-xs text-primary hover:text-primary-dark"
        onClick={onViewAllLogs}
      >
        View All Logs
      </button>
    </div>
  );
}

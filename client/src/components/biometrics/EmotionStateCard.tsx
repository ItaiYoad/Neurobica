import { EmotionalState } from "@/types";

interface EmotionStateCardProps {
  state: EmotionalState;
}

export function EmotionStateCard({ state }: EmotionStateCardProps) {
  // Determine the display title based on type
  const getTitle = () => {
    switch (state.type) {
      case "emotional":
        return "Emotional State";
      case "stress":
        return "Stress Level";
      case "focus":
        return "Focus";
      case "workload":
        return "Workload";
      case "engagement":
        return "Engagement";
      default:
        return state.type.charAt(0).toUpperCase() + state.type.slice(1);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{getTitle()}</div>
        <span className={`px-2 py-0.5 bg-status-${state.color} text-white text-xs font-medium rounded-full`}>
          {state.label}
        </span>
      </div>
      <div className="mt-2">
        <div className="flex justify-between items-center text-xs text-neutral-mid mb-1">
          <span>Low</span>
          <span>High</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-2 bg-status-${state.color} rounded-full`} 
            style={{ width: `${state.level}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

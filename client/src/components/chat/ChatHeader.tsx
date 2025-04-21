import { EmotionalState } from "@/types";

interface ChatHeaderProps {
  toggleSidebar: () => void;
  emotionalState?: EmotionalState;
}

export function ChatHeader({ toggleSidebar, emotionalState }: ChatHeaderProps) {
  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="md:hidden text-gray-500" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
            <div className="flex items-center text-sm text-neutral-mid">
              <span className="flex items-center">
                <span className={`h-2 w-2 ${emotionalState ? `bg-status-${emotionalState.color}` : 'bg-status-calm'} rounded-full mr-1.5`}></span>
                {emotionalState ? `${emotionalState.label} mode active` : 'Emotion-aware mode active'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 rounded-full hover:bg-neutral-light text-neutral-mid">
            <i className="fas fa-info-circle"></i>
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-light text-neutral-mid">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

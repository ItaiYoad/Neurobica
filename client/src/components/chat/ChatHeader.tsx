import { EmotionalState } from "@/types";

interface ChatHeaderProps {
  toggleSidebar: () => void;
  emotionalState?: EmotionalState;
}

export function ChatHeader({ toggleSidebar, emotionalState }: ChatHeaderProps) {
  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center justify-end">
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

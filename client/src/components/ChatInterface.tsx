import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";

interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  const { messages, notifications, sendMessage, isLoading, emotionalState } =
    useChat();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={messages}
          notifications={notifications}
          isLoading={isLoading}
        />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

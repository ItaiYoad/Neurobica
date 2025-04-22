import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";

interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  const { 
    messages, 
    notifications,
    sendMessage, 
    isLoading, 
    emotionalState 
  } = useChat();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] fixed inset-x-0 bottom-0">
      <ChatHeader toggleSidebar={toggleSidebar} emotionalState={emotionalState} />
      <ChatMessages 
        messages={messages} 
        notifications={notifications} 
        isLoading={isLoading} 
      />
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

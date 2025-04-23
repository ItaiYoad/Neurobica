
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "./ui/button";
import { Search, Wand2 } from "lucide-react";

interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  const { messages, sendMessage, isLoading } = useChat();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const suggestions = [
    { icon: Search, text: "Search the web" },
    { icon: Wand2, text: "Generate creative ideas" },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto relative pt-14">
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center mt-6">
            <h1 className="text-4xl font-bold mb-8">What can I help with?</h1>
            <div className="flex flex-wrap justify-center gap-4 max-w-xl">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-12 px-6 flex items-center gap-2"
                  onClick={() => handleSendMessage(suggestion.text)}
                >
                  <suggestion.icon className="h-5 w-5" />
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
        )}
      </div>
      <div className="w-full bg-white">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

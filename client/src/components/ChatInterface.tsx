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
    { icon: Wand2, text: "Generate creative ideas" }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="bg-gray-100 p-4"> {/* Added Header */}
        <h1 className="text-2xl font-bold">Chat Interface</h1> {/* Example Header */}
      </div> {/* End Added Header */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
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
          <div className="w-full max-w-3xl mt-8 flex-grow"> {/* Added flex-grow */}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto"> {/* Added overflow-y-auto */}
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
          <div className="flex-grow"> {/* Added flex-grow */}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
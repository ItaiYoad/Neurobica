import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { EmotionNotification } from "./EmotionNotification";
import { Message, Notification } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 bg-gray-50 h-full">
      <div className="px-4 py-4 min-h-full max-w-3xl mx-auto">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="bg-white rounded-lg p-3 shadow-sm max-w-3xl">
            <div className="flex space-x-2 items-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

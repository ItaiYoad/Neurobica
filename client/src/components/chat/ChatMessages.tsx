import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { EmotionNotification } from "./EmotionNotification";
import { Message, Notification } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  notifications: Notification[];
  isLoading: boolean;
}

export function ChatMessages({ messages, notifications, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, notifications]);

  // Merge messages and notifications chronologically
  const chatItems = [...messages, ...notifications].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      {chatItems.map((item) => {
        if ('role' in item) {
          // This is a message
          return <ChatMessage key={item.id} message={item} />;
        } else {
          // This is a notification
          return <EmotionNotification key={item.id} notification={item} />;
        }
      })}
      
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
  );
}

import { useState, useEffect } from "react";
import { Message, Notification, NotificationType, EmotionalState, MemoryItem } from "@/types";
import { nanoid } from "nanoid";
import { useBiometrics } from "@/context/BiometricsContext";
import { apiRequest } from "@/lib/queryClient";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentEmotionalState, sendMessage: sendWebSocketMessage, lastMessage } = useBiometrics();

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: nanoid(),
      role: "assistant",
      content: "Hello! I'm your Neurobica assistant. I can adapt to your emotional state and help organize your life. How are you feeling today?",
      timestamp: Date.now(),
      emotionalContext: currentEmotionalState ? 
        `I'm currently detecting that you're in a ${currentEmotionalState.label.toLowerCase()} state.` : 
        undefined
    };

    setMessages([welcomeMessage]);
  }, []);

  // Listen for incoming websocket messages (notifications, etc.)
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "chat_message":
          if (lastMessage.data.role === "assistant" && !messages.some(msg => msg.content === lastMessage.data.content)) {
            setMessages(prev => [...prev, {
              id: nanoid(),
              role: lastMessage.data.role,
              content: lastMessage.data.content,
              timestamp: Date.now(),
              emotionalContext: lastMessage.data.emotionalContext,
              memoryTrigger: lastMessage.data.memoryTrigger
            }]);
            setIsLoading(false);
          }
          break;
        case "notification":
          setNotifications(prev => [...prev, {
            ...lastMessage.data,
            id: nanoid(),
            timestamp: Date.now()
          }]);
          break;
      }
    }
  }, [lastMessage]);

  // Send a message to the AI assistant
  const sendMessage = async (content: string) => {
    if (content.trim() === "") return;

    // Add user message to chat
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to backend via API
      const response = await apiRequest("POST", "/api/chat", {
        message: content,
        emotionalState: currentEmotionalState
      });
      
      const data = await response.json();
      
      // The actual assistant response will come via WebSocket
      // The immediate API response is just for acknowledgement
      
      // Also send via WebSocket for logging
      sendWebSocketMessage("chat_message", {
        role: "user",
        content,
        emotionalState: currentEmotionalState
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: "assistant",
        content: "Sorry, I couldn't process your message. Please try again.",
        timestamp: Date.now()
      }]);
    }
  };

  return {
    messages,
    notifications,
    sendMessage,
    isLoading,
    emotionalState: currentEmotionalState
  };
}

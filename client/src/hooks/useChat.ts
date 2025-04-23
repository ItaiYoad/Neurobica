import { useState, useEffect } from "react";
import { Message, Notification, NotificationType, EmotionalState, MemoryItem } from "@/types";
import { nanoid } from "nanoid";
import { useBiometrics } from "@/context/BiometricsContext";
import { apiRequest } from "@/lib/queryClient";
import { useConversations } from "./useConversations";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { currentEmotionalState, sendMessage: sendWebSocketMessage, lastMessage } = useBiometrics();
  const { 
    activeConversationId, 
    activeConversation, 
    setActiveConversation, 
    createConversation,
    getMessages
  } = useConversations();

  // Clear messages when no active conversation
  useEffect(() => {
    if (activeConversationId === null) {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Load messages when active conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (activeConversationId) {
        setIsLoadingMessages(true);
        try {
          const conversationMessages = await getMessages(activeConversationId);
          // Convert to the expected Message format
          if (Array.isArray(conversationMessages)) {
            const formattedMessages = conversationMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp).getTime(),
              emotionalContext: msg.emotionalContext || null,
              memoryTrigger: msg.memoryTrigger || null,
              conversationId: msg.conversationId
            }));
            setMessages(formattedMessages);
          } else {
            console.error("Received non-array message data:", conversationMessages);
            setMessages([]);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      }
    }

    if (activeConversationId) {
      loadMessages();
    }
  }, [activeConversationId, getMessages]);

  // Listen for incoming websocket messages (notifications, etc.)
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "chat_message":
          // Only add if it's for the current conversation or if we're starting a new one
          if (lastMessage.data.role === "assistant" && 
              (!activeConversationId || lastMessage.data.conversationId === activeConversationId) &&
              !messages.some(msg => msg.content === lastMessage.data.content)) {
            
            // If we receive a message with a conversationId but we don't have an active conversation,
            // set that as our active conversation
            if (lastMessage.data.conversationId && !activeConversationId) {
              setActiveConversation(lastMessage.data.conversationId);
            }
            
            setMessages(prev => [...prev, {
              id: lastMessage.data.id || nanoid(),
              role: lastMessage.data.role,
              content: lastMessage.data.content,
              timestamp: Date.now(),
              emotionalContext: lastMessage.data.emotionalContext,
              memoryTrigger: lastMessage.data.memoryTrigger,
              conversationId: lastMessage.data.conversationId
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
  }, [lastMessage, activeConversationId, setActiveConversation]);

  // Start a new conversation
  const startNewConversation = async () => {
    // Create a new conversation and set it as active
    setActiveConversation(null);
    setMessages([]);
  };

  // Send a message to the AI assistant
  const sendMessage = async (content: string) => {
    if (content.trim() === "") return;

    // Add user message to chat
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: Date.now(),
      conversationId: activeConversationId
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to backend via API
      const response = await apiRequest("POST", "/api/chat", {
        message: content,
        emotionalState: currentEmotionalState,
        conversationId: activeConversationId
      });
      
      const data = await response.json();
      
      // If we didn't have an active conversation, set the new one as active
      if (!activeConversationId && data.conversationId) {
        setActiveConversation(data.conversationId);
      }
      
      // Also send via WebSocket for logging
      sendWebSocketMessage("chat_message", {
        role: "user",
        content,
        emotionalState: currentEmotionalState,
        conversationId: data.conversationId || activeConversationId
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: "assistant",
        content: "Sorry, I couldn't process your message. Please try again.",
        timestamp: Date.now(),
        conversationId: activeConversationId
      }]);
    }
  };

  return {
    messages,
    notifications,
    sendMessage,
    startNewConversation,
    isLoading,
    isLoadingMessages,
    emotionalState: currentEmotionalState,
    activeConversationId,
    activeConversation
  };
}

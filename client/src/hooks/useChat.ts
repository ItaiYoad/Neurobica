import { useState, useEffect, useCallback } from "react";
import { Message, Notification, NotificationType, EmotionalState, MemoryItem } from "@/types";
import { nanoid } from "nanoid";
import { useBiometrics } from "@/context/BiometricsContext";
import { apiRequest } from "@/lib/queryClient";
import { useConversations } from "./useConversations";
import { useQuery } from "@tanstack/react-query";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentEmotionalState, sendMessage: sendWebSocketMessage, lastMessage } = useBiometrics();
  const { 
    activeConversationId, 
    activeConversation, 
    setActiveConversation, 
    createConversation 
  } = useConversations();

  // Query for fetching messages for the active conversation
  const {
    data: conversationMessages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['conversationMessages', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];

      try {
        const response = await apiRequest('GET', `/api/conversations/${activeConversationId}/messages`);
        const data = await response.json();

        if (Array.isArray(data)) {
          return data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).getTime(),
            emotionalContext: msg.emotionalContext || null,
            memoryTrigger: msg.memoryTrigger || null,
            conversationId: msg.conversationId
          }));
        } else {
          console.error("Received invalid message data:", data);
          return [];
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        return [];
      }
    },
    enabled: !!activeConversationId
  });

  // When conversation messages data changes, update our messages state
  useEffect(() => {
    if (activeConversationId && conversationMessages) {
      setMessages(conversationMessages);
    } else if (!activeConversationId) {
      setMessages([]);
    }
  }, [activeConversationId, conversationMessages]);

  // Listen for incoming websocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "chat_message":
        // Handle assistant messages - real messages would come from API in a real app
        if (lastMessage.data.role === "assistant") {
          // Check if message belongs to current conversation or we're starting a new one
          const isCurrentConversation = !activeConversationId || 
            lastMessage.data.conversationId === activeConversationId;
          
          // Check if we already have this message (to prevent duplicates)
          const isDuplicate = messages.some(msg => 
            msg.id === lastMessage.data.id || msg.content === lastMessage.data.content
          );
          
          if (isCurrentConversation && !isDuplicate) {
            // If message has a conversation ID but we don't have an active one, set it
            if (lastMessage.data.conversationId && !activeConversationId) {
              setActiveConversation(lastMessage.data.conversationId);
            }
            
            // Add message to our local state
            const newMessage: Message = {
              id: lastMessage.data.id || nanoid(),
              role: lastMessage.data.role,
              content: lastMessage.data.content,
              timestamp: Date.now(),
              emotionalContext: lastMessage.data.emotionalContext,
              memoryTrigger: lastMessage.data.memoryTrigger,
              conversationId: lastMessage.data.conversationId
            };
            setMessages(prev => [...prev, newMessage]);
            setIsLoading(false);
          }
        }
        break;
      
      case "notification":
        // Handle notifications
        const newNotification: Notification = {
          ...lastMessage.data,
          id: lastMessage.data.id || nanoid(),
          timestamp: lastMessage.data.timestamp || Date.now()
        };
        setNotifications(prev => [...prev, newNotification]);
        break;
    }
  }, [lastMessage, activeConversationId, setActiveConversation]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, [setActiveConversation]);

  // Send a message to the AI assistant
  const sendMessage = useCallback(async (content: string) => {
    if (content.trim() === "") return;

    // Create a user message
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: Date.now(),
      conversationId: activeConversationId
    };
    
    // Add to local state
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send via API
      const response = await apiRequest("POST", "/api/chat", {
        message: content,
        emotionalState: currentEmotionalState,
        conversationId: activeConversationId
      });
      
      const data = await response.json();
      
      // Handle conversation creation for new chats
      if (!activeConversationId && data.conversationId) {
        setActiveConversation(data.conversationId);
      }
      
      // Log via WebSocket
      sendWebSocketMessage("chat_message", {
        role: "user",
        content,
        emotionalState: currentEmotionalState,
        conversationId: data.conversationId || activeConversationId
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      
      // Add error message to UI
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: "assistant",
        content: "Sorry, I couldn't process your message. Please try again.",
        timestamp: Date.now(),
        conversationId: activeConversationId
      }]);
    }
  }, [activeConversationId, currentEmotionalState, sendWebSocketMessage, setActiveConversation]);

  return {
    messages,
    notifications,
    sendMessage,
    startNewConversation,
    isLoading,
    isLoadingMessages,
    emotionalState: currentEmotionalState,
    activeConversationId,
    activeConversation,
    refetchMessages
  };
}

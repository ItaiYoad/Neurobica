import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  emotionalTag: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useConversations() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      console.log("Fetching conversations");
      const response = await apiRequest('GET', '/api/conversations');
      const data = await response.json();
      console.log("Conversations fetched:", data);
      return data as Conversation[];
    }
  });

  // Create a new conversation
  const createConversation = useMutation({
    mutationFn: async (title: string = 'New Conversation') => {
      console.log("Creating conversation with title:", title);
      const response = await apiRequest('POST', '/api/conversations', { title });
      return await response.json() as Conversation;
    },
    onSuccess: (newConversation) => {
      console.log("Conversation created:", newConversation);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(newConversation.id);
      return newConversation;
    }
  });

  // Rename a conversation
  const renameConversation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      console.log("Renaming conversation:", id, "to", title);
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, { title });
      return await response.json() as Conversation;
    },
    onSuccess: () => {
      console.log("Conversation renamed successfully");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  // Delete a conversation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting conversation:", id);
      await apiRequest('DELETE', `/api/conversations/${id}`);
      return id;
    },
    onSuccess: (id) => {
      console.log("Conversation deleted:", id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If the active conversation was deleted, unset it
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    }
  });

  // Get messages for a conversation
  const getMessages = useCallback(async (conversationId: string) => {
    console.log("Getting messages for conversation:", conversationId);
    try {
      const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
      const messages = await response.json();
      console.log("Messages received:", messages);
      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }, []);

  // Set active conversation - this is the key function for conversation selection
  const setActiveConversation = useCallback((id: string | null) => {
    console.log("Setting active conversation to:", id);
    setActiveConversationId(id);
    
    // Invalidate and refetch messages for the new conversation
    if (id) {
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', id]
      });
      
      // Force refetch conversations to ensure UI updates
      refetchConversations();
    }
  }, [queryClient, refetchConversations]);

  // Find active conversation in the list
  const activeConversation = useCallback(() => {
    const found = conversations.find(c => c.id === activeConversationId);
    console.log("Active conversation lookup:", activeConversationId, "found:", found || "null");
    return found || null;
  }, [conversations, activeConversationId])();

  return {
    conversations,
    isLoading,
    error,
    activeConversationId,
    activeConversation,
    setActiveConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    getMessages
  };
}
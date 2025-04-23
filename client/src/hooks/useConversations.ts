import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

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

  // Fetch all conversations
  const {
    data: conversations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      const data = await response.json();
      return data as Conversation[];
    }
  });

  // Create a new conversation
  const createConversation = useMutation({
    mutationFn: async (title: string = 'New Conversation') => {
      const response = await apiRequest('POST', '/api/conversations', { title });
      return await response.json() as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(newConversation.id);
      return newConversation;
    }
  });

  // Rename a conversation
  const renameConversation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, { title });
      return await response.json() as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  // Delete a conversation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/conversations/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If the active conversation was deleted, unset it
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    }
  });

  // Get messages for a conversation
  const getMessages = async (conversationId: string) => {
    const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
    return await response.json();
  };

  // Set active conversation and return its data
  const setActiveConversation = (id: string | null) => {
    // Prevent unnecessary re-renders
    if (id !== activeConversationId) {
      setActiveConversationId(id);
      
      if (id) {
        return conversations.find(c => c.id === id) || null;
      }
    }
    
    return null;
  };

  // Get the active conversation
  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId) || null
    : null;

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
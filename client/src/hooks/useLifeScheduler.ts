import { useState, useEffect } from "react";
import { MemoryItem, MemoryItemType } from "@/types";
import { nanoid } from "nanoid";
import { useBiometrics } from "@/context/BiometricsContext";
import { apiRequest } from "@/lib/queryClient";

export function useLifeScheduler() {
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const { lastMessage } = useBiometrics();

  // Load initial memory items
  useEffect(() => {
    const fetchMemoryItems = async () => {
      try {
        const response = await apiRequest("GET", "/api/memories");
        const data = await response.json();
        setMemoryItems(data);
      } catch (error) {
        console.error("Error fetching memory items:", error);
      }
    };

    fetchMemoryItems();
  }, []);

  // Listen for memory updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === "memory") {
      const memoryItem = lastMessage.data;
      
      // Add new memory item
      if (memoryItem.action === "add") {
        setMemoryItems(prev => [...prev, {
          ...memoryItem.item,
          id: memoryItem.item.id || nanoid(),
          createdAt: memoryItem.item.createdAt || Date.now()
        }]);
      } 
      // Update existing memory item
      else if (memoryItem.action === "update" && memoryItem.item.id) {
        setMemoryItems(prev => 
          prev.map(item => 
            item.id === memoryItem.item.id ? { ...item, ...memoryItem.item } : item
          )
        );
      }
      // Remove memory item
      else if (memoryItem.action === "remove" && memoryItem.itemId) {
        setMemoryItems(prev => prev.filter(item => item.id !== memoryItem.itemId));
      }
    }
  }, [lastMessage]);

  // Add a new memory item
  const addMemoryItem = async (item: Omit<MemoryItem, "id" | "createdAt">) => {
    try {
      const newItem: MemoryItem = {
        ...item,
        id: nanoid(),
        createdAt: Date.now()
      };
      
      // Optimistically update UI
      setMemoryItems(prev => [...prev, newItem]);
      
      // Send to backend
      await apiRequest("POST", "/api/memories", { item: newItem });
    } catch (error) {
      console.error("Error adding memory item:", error);
      // Revert on error - removing the last item added since it failed
      setMemoryItems(prev => prev.slice(0, -1));
    }
  };

  // Remove a memory item
  const removeMemoryItem = async (id: string) => {
    try {
      // Optimistically update UI
      const removedItem = memoryItems.find(item => item.id === id);
      setMemoryItems(prev => prev.filter(item => item.id !== id));
      
      // Send to backend
      await apiRequest("DELETE", `/api/memories/${id}`);
    } catch (error) {
      console.error("Error removing memory item:", error);
      // Revert on error if we have the removed item
      const removedItem = memoryItems.find(item => item.id === id);
      if (removedItem) {
        setMemoryItems(prev => [...prev, removedItem]);
      }
    }
  };

  return {
    memoryItems,
    addMemoryItem,
    removeMemoryItem
  };
}

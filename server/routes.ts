import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { setupWebSocketHandlers } from "./services/webSocket";
import { chatHandler } from "./services/openai";
import WebSocket from "ws";
import { extractMemoriesFromText } from "./services/biometrics";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  // Setup WebSocket handlers with async initialization
  await setupWebSocketHandlers(wss);
  
  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, emotionalState } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Log the chat message
      const logId = nanoid();
      await storage.createLog({
        id: logId,
        type: "message",
        message: `User message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        data: { message, emotionalState },
      });
      
      // Process chat in background
      chatHandler(message, emotionalState)
        .then(response => {
          // Broadcast message to all clients
          const messageId = nanoid();
          
          // Check for potential life scheduler content
          const memories = extractMemoriesFromText(message);
          let memoryTriggerId: string | null = null;
          
          // Store any extracted memories
          if (memories.length > 0) {
            memories.forEach(async (memory) => {
              const memoryId = nanoid();
              await storage.createMemory({
                id: memoryId,
                type: memory.type,
                content: memory.content,
                time: memory.time,
                category: memory.category,
              });
              
              // Save the first memory ID to associate with the message
              if (!memoryTriggerId) {
                memoryTriggerId = memoryId;
              }
              
              // Broadcast memory to clients
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: "memory",
                    data: {
                      action: "add",
                      item: {
                        id: memoryId,
                        type: memory.type,
                        content: memory.content,
                        time: memory.time,
                        category: memory.category,
                        createdAt: Date.now()
                      }
                    }
                  }));
                }
              });
            });
          }
          
          // Store the message
          storage.createMessage({
            id: messageId,
            role: "assistant",
            content: response.message,
            emotionalContext: response.emotionalContext,
            memoryTriggerId
          });
          
          // Send to all connected clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "chat_message",
                data: {
                  id: messageId,
                  role: "assistant",
                  content: response.message,
                  emotionalContext: response.emotionalContext,
                  memoryTrigger: memories.length > 0 ? {
                    id: memoryTriggerId,
                    type: memories[0].type,
                    content: memories[0].content,
                    time: memories[0].time,
                    category: memories[0].category,
                    createdAt: Date.now()
                  } : undefined
                }
              }));
            }
          });
          
          // Log the response
          storage.createLog({
            id: nanoid(),
            type: "message",
            message: `Assistant response: ${response.message.substring(0, 50)}${response.message.length > 50 ? '...' : ''}`,
            data: { message: response.message, emotionalContext: response.emotionalContext }
          });
          
        })
        .catch(error => {
          console.error("Error processing chat:", error);
          
          // Log the error
          storage.createLog({
            id: nanoid(),
            type: "alert",
            message: `Chat processing error: ${error.message}`,
            data: { error: error.message }
          });
        });
      
      // Acknowledge receipt immediately
      res.json({ message: "Message received, processing" });
      
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get memory items
  app.get("/api/memories", async (req, res) => {
    try {
      const memories = await storage.getAllMemories();
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create memory item
  app.post("/api/memories", async (req, res) => {
    try {
      const { item } = req.body;
      
      if (!item || !item.type || !item.content) {
        return res.status(400).json({ message: "Invalid memory item" });
      }
      
      const memory = await storage.createMemory({
        id: item.id || nanoid(),
        type: item.type,
        content: item.content,
        time: item.time,
        category: item.category
      });
      
      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "memory",
            data: {
              action: "add",
              item: memory
            }
          }));
        }
      });
      
      res.json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete memory item
  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMemory(id);
      
      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "memory",
            data: {
              action: "remove",
              itemId: id
            }
          }));
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Biometric data simulation endpoint (for testing)
  app.post("/api/biometrics/simulate", async (req, res) => {
    try {
      const { emotionalState } = req.body;
      
      if (!emotionalState) {
        return res.status(400).json({ message: "Emotional state is required" });
      }
      
      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "biometric_update",
            data: {
              emotionalStates: [emotionalState],
              heartRate: Math.floor(Math.random() * 20) + 60, // 60-80
              eegAlpha: (Math.random() * 5 + 5).toFixed(1) // 5-10
            }
          }));
        }
      });
      
      // Log the simulated biometric update
      await storage.createLog({
        id: nanoid(),
        type: "biometric",
        message: `Simulated biometric update: ${emotionalState.label}`,
        data: { emotionalState }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error simulating biometrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create notification endpoint
  app.post("/api/notifications", async (req, res) => {
    try {
      const { notification } = req.body;
      
      if (!notification || !notification.type || !notification.title) {
        return res.status(400).json({ message: "Invalid notification" });
      }
      
      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "notification",
            data: notification
          }));
        }
      });
      
      // Log the notification
      await storage.createLog({
        id: nanoid(),
        type: "alert",
        message: `Notification sent: ${notification.title}`,
        data: { notification }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

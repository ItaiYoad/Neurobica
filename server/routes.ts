import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import WebSocket, { WebSocketServer } from "ws";
import { nanoid } from "nanoid";

import { storage } from "./storage";
import { setupWebSocketHandlers } from "./services/webSocket";
import { chatHandler, generateChatTitle } from "./services/openai";
import { extractMemoriesFromText } from "./services/biometrics";
import type {
  InsertMessage,
  InsertMemory,
  InsertLog,
  InsertBiometricData,
} from "./storage";

export function setupRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  setupWebSocketHandlers(wss);
  const upload = multer();

  // Create a new conversation with AI-generated title
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { userId = null } = req.body;
      const conversationId = nanoid();

      // Insert placeholder conversation
      await storage.createConversation({
        id: conversationId,
        title: "New Conversation",
        userId,
        summary: null,
        emotionalTag: null,
        lastMessageAt: null,
        messageCount: 0,
      });

      // Generate a smart title via OpenAI
      const title = await generateChatTitle();
      await storage.updateConversation(conversationId, { title });

      const conversation = await storage.getConversation(conversationId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send a message and get AI response
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, conversationId, emotionalState } = req.body;
      const currentConversationId = conversationId || nanoid();

      // Store incoming user message
      await storage.createMessage({
        id: nanoid(),
        conversationId: currentConversationId,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Process AI response
      const ai = await chatHandler(message, emotionalState);

      // Store AI response
      await storage.createMessage({
        id: nanoid(),
        conversationId: currentConversationId,
        role: "assistant",
        content: ai.message,
        timestamp: new Date().toISOString(),
      });

      // Update conversation metadata
      await storage.updateConversation(currentConversationId, {
        lastMessageAt: new Date().toISOString(),
        messageCount:
          (await storage.getMessageCount(currentConversationId)) + 1,
      });

      res.json({ conversationId: currentConversationId, ...ai });
    } catch (error) {
      console.error("Chat error:", error);
      await storage.createLog({
        id: nanoid(),
        type: "alert",
        message: `Chat processing error: ${error.message}`,
        data: { error: error.message },
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });
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
        category: item.category,
      });

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "memory",
              data: {
                action: "add",
                item: memory,
              },
            }),
          );
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
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "memory",
              data: {
                action: "remove",
                itemId: id,
              },
            }),
          );
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

  // Configuration endpoints for NeuroBrave and NeurospeedOS

  // Get NeuroBrave config
  app.get("/api/config/neurobrave", async (req, res) => {
    try {
      const { loadNeuroBraveConfig } = await import("./services/configLoader");
      const config = await loadNeuroBraveConfig();

      if (config) {
        // Don't send password for security
        res.json({
          email: config.email,
          verboseSocketLog: config.verboseSocketLog,
        });
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Error fetching NeuroBrave config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set NeuroBrave config
  app.post("/api/config/neurobrave", async (req, res) => {
    try {
      const { email, password, verboseSocketLog } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const { saveNeuroBraveConfig } = await import("./services/configLoader");
      const { initializeNeuroBraveApi } = await import(
        "./services/neuroBraveApi"
      );

      const config = {
        email,
        password,
        verboseSocketLog: verboseSocketLog || false,
      };

      // Save the configuration
      const saved = await saveNeuroBraveConfig(config);

      if (saved) {
        // Initialize the API with the new config
        await initializeNeuroBraveApi(config);

        // Log the configuration update
        await storage.createLog({
          id: nanoid(),
          type: "config",
          message: "NeuroBrave configuration updated",
          data: { email },
        });

        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to save configuration" });
      }
    } catch (error) {
      console.error("Error saving NeuroBrave config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test NeuroBrave connection
  app.post("/api/config/neurobrave/test", async (req, res) => {
    try {
      const { loadNeuroBraveConfig } = await import("./services/configLoader");
      const config = await loadNeuroBraveConfig();

      if (!config || !config.email || !config.password) {
        return res.status(400).json({
          success: false,
          message: "NeuroBrave configuration is incomplete",
        });
      }

      const { initializeNeuroBraveApi } = await import(
        "./services/neuroBraveApi"
      );
      const neuroBraveApi = await initializeNeuroBraveApi(config);

      // If initialization was successful
      if (neuroBraveApi) {
        res.json({ success: true });
      } else {
        res.json({
          success: false,
          message:
            "Failed to connect to NeuroBrave API. Check your credentials.",
        });
      }
    } catch (error) {
      console.error("Error testing NeuroBrave connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test NeuroBrave connection",
      });
    }
  });

  // Get NeurospeedOS config
  app.get("/api/config/neurospeed", async (req, res) => {
    try {
      const { loadNeurospeedConfig } = await import("./services/configLoader");
      const config = await loadNeurospeedConfig();

      if (config) {
        // Don't send password for security
        res.json({
          accountId: config.accountId,
          username: config.username,
          hiaId: config.hiaId,
          verboseSocketLog: config.verboseSocketLog,
        });
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Error fetching NeurospeedOS config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set NeurospeedOS config
  app.post("/api/config/neurospeed", async (req, res) => {
    try {
      const { accountId, username, userPassword, hiaId, verboseSocketLog } =
        req.body;

      if (!accountId || !username || !userPassword || !hiaId) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const { saveNeurospeedConfig } = await import("./services/configLoader");
      const { initializeNeurospeedOS } = await import(
        "./services/neurospeedOS"
      );

      const config = {
        accountId,
        username,
        userPassword,
        hiaId,
        verboseSocketLog: verboseSocketLog || false,
      };

      // Save the configuration
      const saved = await saveNeurospeedConfig(config);

      if (saved) {
        // Initialize the API with the new config
        await initializeNeurospeedOS(config);

        // Log the configuration update
        await storage.createLog({
          id: nanoid(),
          type: "config",
          message: "NeurospeedOS configuration updated",
          data: { username, accountId },
        });

        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to save configuration" });
      }
    } catch (error) {
      console.error("Error saving NeurospeedOS config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test NeurospeedOS connection
  app.post("/api/config/neurospeed/test", async (req, res) => {
    try {
      const { loadNeurospeedConfig } = await import("./services/configLoader");
      const config = await loadNeurospeedConfig();

      if (
        !config ||
        !config.username ||
        !config.userPassword ||
        !config.hiaId
      ) {
        return res.status(400).json({
          success: false,
          message: "NeurospeedOS configuration is incomplete",
        });
      }

      const { initializeNeurospeedOS } = await import(
        "./services/neurospeedOS"
      );
      const neurospeedOS = await initializeNeurospeedOS(config);

      // If initialization was successful
      if (neurospeedOS) {
        res.json({ success: true });
      } else {
        res.json({
          success: false,
          message: "Failed to connect to NeurospeedOS. Check your credentials.",
        });
      }
    } catch (error) {
      console.error("Error testing NeurospeedOS connection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test NeurospeedOS connection",
      });
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
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "biometric_update",
              data: {
                emotionalStates: [emotionalState],
                heartRate: Math.floor(Math.random() * 20) + 60, // 60-80
                eegAlpha: (Math.random() * 5 + 5).toFixed(1), // 5-10
              },
            }),
          );
        }
      });

      // Log the simulated biometric update
      await storage.createLog({
        id: nanoid(),
        type: "biometric",
        message: `Simulated biometric update: ${emotionalState.label}`,
        data: { emotionalState },
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
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "notification",
              data: notification,
            }),
          );
        }
      });

      // Log the notification
      await storage.createLog({
        id: nanoid(),
        type: "alert",
        message: `Notification sent: ${notification.title}`,
        data: { notification },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Speech-to-Text endpoint
  app.post(
    "/api/audio/transcribe",
    upload.single("audio"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
          return res.status(500).json({
            success: false,
            message:
              "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
          });
        }

        const audioBuffer = req.file.buffer;
        const language = req.body.language;
        const prompt = req.body.prompt;

        // Transcribe audio to text
        const transcription = await speechToText(
          audioBuffer,
          `${nanoid()}.mp3`,
          {
            language,
            prompt,
          },
        );

        // Log successful transcription
        await storage.createLog({
          id: nanoid(),
          type: "audio",
          message: `Audio transcribed successfully (${Math.round(audioBuffer.length / 1024)} KB)`,
          data: {
            transcription:
              transcription.substring(0, 100) +
              (transcription.length > 100 ? "..." : ""),
          },
        });

        res.json({ success: true, transcription });
      } catch (error: unknown) {
        console.error("Error transcribing audio:", error);

        // Extract error message safely
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Log the error
        await storage.createLog({
          id: nanoid(),
          type: "error",
          message: `Audio transcription error: ${errorMessage}`,
          data: { error: errorMessage },
        });

        res.status(500).json({
          success: false,
          message: `Failed to transcribe audio: ${errorMessage}`,
        });
      }
    },
  );

  // Text-to-Speech endpoint
  app.post("/api/audio/speech", async (req, res) => {
    try {
      const { text, voice, speed } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
        });
      }

      // Convert text to speech
      const { audio, contentType } = await textToSpeech(text, { voice, speed });

      // Log successful TTS generation
      await storage.createLog({
        id: nanoid(),
        type: "audio",
        message: `Generated speech audio for text (${Math.round(text.length)} chars)`,
        data: {
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        },
      });

      // Set the appropriate content type and send the audio data
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", 'attachment; filename="speech.mp3"');
      res.send(audio);
    } catch (error: unknown) {
      console.error("Error generating speech:", error);

      // Extract error message safely
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log the error
      await storage.createLog({
        id: nanoid(),
        type: "error",
        message: `Text-to-speech error: ${errorMessage}`,
        data: { error: errorMessage },
      });

      res.status(500).json({
        success: false,
        message: `Failed to generate speech: ${errorMessage}`,
      });
    }
  });

  // Audio settings endpoint
  app.get("/api/audio/settings", async (req, res) => {
    try {
      res.json({
        ttsEnabled: true,
        sttEnabled: true,
        voiceOptions: [
          {
            id: "alloy",
            name: "Alloy",
            description: "Neutral and balanced voice",
          },
          {
            id: "echo",
            name: "Echo",
            description: "Deeper, authoritative voice",
          },
          {
            id: "fable",
            name: "Fable",
            description: "Expressive, narrative-focused voice",
          },
          {
            id: "onyx",
            name: "Onyx",
            description: "Versatile, professional voice",
          },
          { id: "nova", name: "Nova", description: "Warm, natural voice" },
          {
            id: "shimmer",
            name: "Shimmer",
            description: "Clear, optimistic voice",
          },
        ],
        defaultVoice: "nova",
        speedOptions: [
          { value: 0.8, label: "Slow" },
          { value: 1.0, label: "Normal" },
          { value: 1.2, label: "Fast" },
        ],
        defaultSpeed: 1.0,
      });
    } catch (error) {
      console.error("Error fetching audio settings:", error);
      res.status(500).json({ message: "Failed to fetch audio settings" });
    }
  });

  // Update audio settings endpoint
  app.post("/api/audio/settings", async (req, res) => {
    try {
      const { ttsEnabled, sttEnabled, defaultVoice, defaultSpeed } = req.body;

      // Here you would normally save these settings to a database or config file
      // For now, just acknowledge the update

      await storage.createLog({
        id: nanoid(),
        type: "config",
        message: "Audio settings updated",
        data: { ttsEnabled, sttEnabled, defaultVoice, defaultSpeed },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating audio settings:", error);
      res.status(500).json({ message: "Failed to update audio settings" });
    }
  });

  return httpServer;
}

import { WebSocketServer, WebSocket } from "ws";
import { simulateBiometricData } from "./biometrics";
import { nanoid } from "nanoid";
import { NotificationType } from "@/types";
import { storage } from "../storage";
import { 
  loadNeuroBraveConfig, 
  loadNeurospeedConfig, 
  saveNeuroBraveConfig, 
  saveNeurospeedConfig 
} from "./configLoader";
import { 
  initializeNeuroBraveApi, 
  getNeuroBraveApiService 
} from "./neuroBraveApi";
import { 
  initializeNeurospeedOS, 
  getNeurospeedOSService 
} from "./neurospeedOS";

// Declare global wss variable
declare global {
  var wss: WebSocketServer;
}

export async function setupWebSocketHandlers(wss: WebSocketServer) {
  // Store WebSocket server globally for access by other services
  global.wss = wss;
  
  // Keep track of connected clients
  const clients = new Set<WebSocket>();
  
  // Initialize biometric services if configs are available
  await initializeBiometricServices();
  
  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${clients.size}`);
    
    // Send initial biometric data
    const neurospeedOSService = getNeurospeedOSService();
    
    if (neurospeedOSService) {
      // If NeurospeedOS service is active, initial data will come from there
      console.log('Using NeurospeedOS for biometric data');
    } else {
      // Otherwise use simulation
      simulateBiometricData().then((data) => {
        ws.send(JSON.stringify({
          type: "biometric_update",
          data
        }));
      });
    }
    
    // Handle messages from clients
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("WebSocket message received:", data);
        
        // Log the message
        await storage.createLog({
          id: nanoid(),
          type: "message",
          message: `WebSocket message: ${data.type}`,
          data
        });
        
        // Handle message based on type
        if (data.type === "chat_message") {
          // Already handled by the REST API
        } else if (data.type === "config_update") {
          // Handle configuration updates
          await handleConfigUpdate(data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    
    // Handle disconnection
    ws.on("close", () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
    });
    
    // Send welcome notification
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "notification",
          data: {
            id: nanoid(),
            type: NotificationType.FeedbackLoop,
            title: "Welcome to Neurobica",
            message: "I'll adapt to your emotional state as we interact. How are you feeling today?",
            options: [
              { label: "I'm feeling calm", action: "respond_calm" },
              { label: "I'm a bit stressed", action: "respond_stressed" }
            ],
            timestamp: Date.now()
          }
        }));
      }
    }, 2000);
  });
  
  // Only set up biometric simulation if NeurospeedOS service is not available
  const neurospeedOSService = getNeurospeedOSService();
  
  if (!neurospeedOSService) {
    // Set up periodic biometric data simulation (every 15 seconds)
    setInterval(async () => {
      if (clients.size > 0) {
        const data = await simulateBiometricData();
        
        // Broadcast to all clients
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "biometric_update",
              data
            }));
          }
        }
        
        // Occasionally send emotion-triggered notifications (20% chance)
        if (Math.random() < 0.2) {
          // Get the primary emotional state
          const emotionalState = data.emotionalStates.find(state => state.type === "emotional");
          
          if (emotionalState) {
            sendEmotionBasedNotification(emotionalState, clients);
          }
        }
      }
    }, 15000);
  }
}

/**
 * Send emotion-based notification to clients
 */
async function sendEmotionBasedNotification(emotionalState: any, clients: Set<WebSocket>) {
  const isStressed = emotionalState.level > 65;
  const isCalm = emotionalState.level < 35;
  
  let notification;
  
  if (isStressed) {
    // Stress notification
    notification = {
      id: nanoid(),
      type: Math.random() < 0.5 ? NotificationType.FeedbackLoop : NotificationType.ContextBased,
      title: "I notice your stress level is increasing",
      message: Math.random() < 0.5 ? 
        "Is this accurate?" : 
        "Would you like to try a quick breathing exercise?",
      options: Math.random() < 0.5 ? 
        [
          { label: "Yes", action: "confirm_stressed" },
          { label: "No", action: "deny_stressed" }
        ] :
        [
          { label: "Yes, guide me", action: "breathing_exercise" },
          { label: "No thanks", action: "decline_exercise" }
        ],
      emotionalState,
      timestamp: Date.now()
    };
  } else if (isCalm) {
    // Calm notification
    notification = {
      id: nanoid(),
      type: NotificationType.ContextBased,
      title: "You seem relaxed right now",
      message: "This is a great time to plan or reflect. Would you like some suggestions?",
      options: [
        { label: "Yes, please", action: "calm_suggestions" },
        { label: "Not now", action: "decline_suggestions" }
      ],
      emotionalState,
      timestamp: Date.now()
    };
  } else {
    // Random check-in
    notification = {
      id: nanoid(),
      type: NotificationType.ConversationBased,
      title: "Checking in",
      message: "How are you feeling right now? Your biometric signals are showing moderate activity.",
      options: [
        { label: "I'm doing well", action: "feeling_good" },
        { label: "I'm a bit tense", action: "feeling_tense" },
        { label: "Just busy", action: "feeling_busy" }
      ],
      emotionalState,
      timestamp: Date.now()
    };
  }
  
  // Log the notification
  await storage.createLog({
    id: nanoid(),
    type: "alert",
    message: `Emotion-triggered notification: ${notification.title}`,
    data: { notification }
  });
  
  // Broadcast notification to all clients
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "notification",
        data: notification
      }));
    }
  }
}

/**
 * Initialize NeuroBrave and NeurospeedOS services if configs are available
 */
async function initializeBiometricServices(): Promise<void> {
  try {
    // Check for NeuroBrave config
    const neuroBraveConfig = await loadNeuroBraveConfig();
    if (neuroBraveConfig && neuroBraveConfig.email && neuroBraveConfig.password) {
      console.log('Initializing NeuroBrave API service');
      await initializeNeuroBraveApi(neuroBraveConfig);
    }
    
    // Check for NeurospeedOS config
    const neurospeedConfig = await loadNeurospeedConfig();
    if (neurospeedConfig && neurospeedConfig.username && neurospeedConfig.userPassword) {
      console.log('Initializing NeurospeedOS service');
      
      const neurospeedOSService = await initializeNeurospeedOS(neurospeedConfig);
      
      // Set up handlers for biometric data
      neurospeedOSService.onEEGData((data) => {
        console.log('EEG data received from NeurospeedOS', data.hiaId);
        
        // Additional processing can be done here if needed
      });
      
      neurospeedOSService.onHeartRateData((heartRate) => {
        console.log('Heart rate data received:', heartRate);
      });
      
      neurospeedOSService.onDeviceConnection((data) => {
        console.log('Device connected to NeurospeedOS:', data);
      });
      
      neurospeedOSService.onDeviceDisconnection((data) => {
        console.log('Device disconnected from NeurospeedOS:', data);
      });
    }
  } catch (error) {
    console.error('Error initializing biometric services:', error);
  }
}

/**
 * Handle configuration updates from client
 */
async function handleConfigUpdate(data: any): Promise<void> {
  try {
    if (data.config === 'neurobrave') {
      // Update NeuroBrave config
      const config = {
        email: data.email || '',
        password: data.password || '',
        verboseSocketLog: data.verboseSocketLog || false
      };
      
      // Save config
      const saved = await saveNeuroBraveConfig(config);
      
      if (saved) {
        // Initialize NeuroBrave API
        await initializeNeuroBraveApi(config);
      }
    } else if (data.config === 'neurospeed') {
      // Update NeurospeedOS config
      const config = {
        accountId: data.accountId || '',
        username: data.username || '',
        userPassword: data.userPassword || '',
        hiaId: data.hiaId || '',
        verboseSocketLog: data.verboseSocketLog || false
      };
      
      // Save config
      const saved = await saveNeurospeedConfig(config);
      
      if (saved) {
        // Initialize NeurospeedOS
        await initializeNeurospeedOS(config);
      }
    }
  } catch (error) {
    console.error('Error handling config update:', error);
  }
}

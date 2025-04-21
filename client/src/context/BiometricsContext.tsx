import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BiometricData, BiometricSource, EmotionalState, WebSocketMessage } from "@/types";
import { simulateBiometricData } from "@/lib/biometrics";

interface BiometricsContextType {
  biometricSources: BiometricSource[];
  biometricData: BiometricData;
  emotionalStates: EmotionalState[];
  currentEmotionalState: EmotionalState | undefined;
  connected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (
    type: "biometric_update" | "chat_message" | "notification" | "log" | "memory" | "connection_status", 
    data: any
  ) => void;
}

const BiometricsContext = createContext<BiometricsContextType | undefined>(undefined);

export function BiometricsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    // Connection opened
    ws.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setConnected(true);
    });
    
    // Listen for messages
    ws.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(message);
        console.log("WebSocket message received:", message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    // Connection closed
    ws.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      setConnected(false);
    });
    
    // Connection error
    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    });
    
    setSocket(ws);
    
    // Clean up
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);
  
  // Initialize with default sources
  const [biometricSources, setBiometricSources] = useState<BiometricSource[]>([
    {
      id: "apple-watch",
      name: "Apple Watch",
      icon: "fas fa-watch",
      connected: true
    },
    {
      id: "muse-headband",
      name: "Muse Headband",
      icon: "fas fa-brain",
      connected: true
    }
  ]);
  
  // Initial emotional states
  const [emotionalStates, setEmotionalStates] = useState<EmotionalState[]>([
    {
      type: "emotional",
      level: 30,
      label: "Calm",
      color: "calm"
    },
    {
      type: "stress",
      level: 60,
      label: "Moderate",
      color: "moderate"
    },
    {
      type: "focus",
      level: 85,
      label: "High",
      color: "focused"
    }
  ]);
  
  // Initial biometric data
  const [biometricData, setBiometricData] = useState<BiometricData>({
    heartRate: 72,
    eegAlpha: 8.2,
    emotionalStates: emotionalStates,
    timestamp: Date.now()
  });
  
  // Extract the primary emotional state (for UI)
  const currentEmotionalState = emotionalStates.find(state => state.type === "emotional");

  // Listen for biometric updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === "biometric_update") {
      const data = lastMessage.data;
      
      // Update sources connection status if provided
      if (data.sources) {
        setBiometricSources(prevSources => 
          prevSources.map(source => {
            const updatedSource = data.sources.find((s: BiometricSource) => s.id === source.id);
            return updatedSource ? { ...source, ...updatedSource } : source;
          })
        );
      }
      
      // Update emotional states if provided
      if (data.emotionalStates) {
        setEmotionalStates(data.emotionalStates);
      }
      
      // Update biometric data if provided
      if (data.heartRate || data.eegAlpha) {
        setBiometricData(prev => ({
          ...prev,
          heartRate: data.heartRate || prev.heartRate,
          eegAlpha: data.eegAlpha || prev.eegAlpha,
          emotionalStates: emotionalStates,
          timestamp: Date.now()
        }));
      }
    }
  }, [lastMessage]);
  
  // Simulate biometric data when not connected to real sources
  useEffect(() => {
    // Only simulate if not connected to a real WebSocket
    if (!connected) {
      const interval = setInterval(() => {
        const simulatedData = simulateBiometricData(biometricData, emotionalStates);
        
        setBiometricData(simulatedData.biometricData);
        setEmotionalStates(simulatedData.emotionalStates);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [connected, biometricData, emotionalStates]);

  // Send message function for WebSocket
  const sendMessage = (
    type: "biometric_update" | "chat_message" | "notification" | "log" | "memory" | "connection_status", 
    data: any
  ) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, data };
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return (
    <BiometricsContext.Provider value={{
      biometricSources,
      biometricData,
      emotionalStates,
      currentEmotionalState,
      connected,
      lastMessage,
      sendMessage
    }}>
      {children}
    </BiometricsContext.Provider>
  );
}

export function useBiometrics() {
  const context = useContext(BiometricsContext);
  if (context === undefined) {
    throw new Error("useBiometrics must be used within a BiometricsProvider");
  }
  return context;
}

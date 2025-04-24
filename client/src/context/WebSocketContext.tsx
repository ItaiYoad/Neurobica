import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { WebSocketMessage } from "@/types";

type WebSocketContextType = {
  connected: boolean;
  sendMessage: (type: string, data: any) => void;
  lastMessage: WebSocketMessage | null;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port = window.location.port || "5000";
    const wsUrl = `${protocol}//${window.location.hostname}:${port}/ws`;
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

  // Send message through WebSocket
  const sendMessage = (type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, data };
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

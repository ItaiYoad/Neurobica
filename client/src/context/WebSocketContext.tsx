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
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 3000;

    function connect() {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const hostname = window.location.hostname || '0.0.0.0';
        const port = window.location.port || "5000";
        const wsUrl = `${protocol}//${hostname}:${port}/ws`;
        ws = new WebSocket(wsUrl);

        // Prevent Eruda from intercepting WebSocket events
        ws.addEventListener = ws.addEventListener.bind(ws);
        ws.removeEventListener = ws.removeEventListener.bind(ws);

        // Connection opened
        ws.addEventListener("open", () => {
          console.log("WebSocket connection established");
          setConnected(true);
          reconnectAttempts = 0;
          clearTimeout(reconnectTimeout);
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
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connect, RECONNECT_INTERVAL);
          }
        });

        // Connection error
        ws.addEventListener("error", (error) => {
          console.error("WebSocket error:", error);
          setConnected(false);
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connect, RECONNECT_INTERVAL);
          }
        });
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, RECONNECT_INTERVAL);
        }
      }
    }

    connect();
    setSocket(ws);

    // Clean up
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      clearTimeout(reconnectTimeout);
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
import { useState, useEffect } from "react";
import { SystemLog } from "@/types";
import { useBiometrics } from "@/context/BiometricsContext";
import { apiRequest } from "@/lib/queryClient";

export function useSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const { lastMessage } = useBiometrics();

  // Load initial logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiRequest("GET", "/api/logs");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchLogs();
  }, []);

  // Listen for new logs from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === "log") {
      const newLog = lastMessage.data;
      
      setLogs(prev => {
        // Add new log at the beginning to show newest first
        const updated = [newLog, ...prev];
        // Limit to prevent too many logs in memory
        return updated.slice(0, 100);
      });
    }
  }, [lastMessage]);

  // View all logs (would navigate to logs page in a real app)
  const viewAllLogs = () => {
    console.log("View all logs clicked");
    // This would typically navigate to a dedicated logs page
    // For POC, we'll just fetch more logs
    const fetchMoreLogs = async () => {
      try {
        const response = await apiRequest("GET", "/api/logs?limit=50");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching more logs:", error);
      }
    };

    fetchMoreLogs();
  };

  return {
    logs,
    viewAllLogs
  };
}

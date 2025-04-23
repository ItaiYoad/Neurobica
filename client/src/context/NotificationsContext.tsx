import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

export interface NotificationOption {
  label: string;
  action: string;
}

export interface Notification {
  id: string;
  type: "feedback_loop" | "system" | "alert" | "context_based";
  title: string;
  message: string;
  read: boolean;
  options?: NotificationOption[];
  emotionalState?: any;
  timestamp: number;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "read" | "timestamp">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  handleNotificationAction: (id: string, action: string) => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  // Ref to ensure welcome toast appears only once
  const welcomeShownRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          const {
            id,
            title,
            message,
            options,
            emotionalState,
            type: notifType,
            timestamp,
          } = data.data;
          // Skip duplicate welcome notifications
          if (title === "Welcome to Neurobica") {
            if (welcomeShownRef.current) return;
            welcomeShownRef.current = true;
          }

          setNotifications((prev) => {
            // Prevent duplicates by id
            if (prev.some((n) => n.id === id)) {
              return prev;
            }

            const notification: Notification = {
              id,
              type: notifType,
              title,
              message,
              options,
              emotionalState,
              read: false,
              timestamp: timestamp || Date.now(),
            };

            // Show toast for new notification
            toast({
              title: notification.title,
              description: notification.message,
              variant:
                notification.type === "alert" ? "destructive" : "default",
            });

            return [notification, ...prev];
          });
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    });

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
    // We purposefully leave out 'toast' from dependencies to initialize the socket only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to add a notification manually
  const addNotification = (
    notification: Omit<Notification, "id" | "read" | "timestamp">,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    toast({
      title: newNotification.title,
      description: newNotification.message,
      variant: newNotification.type === "alert" ? "destructive" : "default",
    });
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Handle notification action (used for feedback loops)
  const handleNotificationAction = (id: string, action: string) => {
    // Mark the notification as read
    markAsRead(id);

    // Handle different actions
    switch (action) {
      case "stress_relief":
        // Here you would trigger the appropriate response
        toast({
          title: "Relaxation routine",
          description:
            "Take 3 deep breaths. Inhale for 4 counts, hold for 7, exhale for 8.",
        });
        break;
      case "respond_calm":
        toast({
          title: "Response noted",
          description: "I'll adjust my responses based on your calm state.",
        });
        break;
      case "respond_stressed":
        toast({
          title: "Response noted",
          description: "I'll provide more supportive and simplified responses.",
        });
        break;
      default:
        break;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        handleNotificationAction,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}

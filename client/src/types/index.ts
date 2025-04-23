// Biometric Types
export type BiometricSource = {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
};

export type EmotionalState = {
  type: "emotional" | "stress" | "focus" | "workload" | "engagement";
  level: number; // 0-100
  label: "Calm" | "Stressed" | "Moderate" | "High" | "Low";
  color: "calm" | "alert" | "moderate" | "focused" | "engaged";
};

export type BiometricData = {
  heartRate: number;
  eegAlpha: number;
  emotionalStates: EmotionalState[];
  timestamp: number;
};

// Chat Types
export type MessageRole = "user" | "assistant" | "system";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  emotionalContext?: string;
  memoryTrigger?: MemoryItem;
  isVoiceMessage?: boolean;
  conversationId?: string | null;
};

// Notification Types
export enum NotificationType {
  FeedbackLoop = "feedback_loop",
  ContextBased = "context_based",
  ConversationBased = "conversation_based"
}

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  options?: {
    label: string;
    action: string;
  }[];
  emotionalState?: EmotionalState;
  timestamp: number;
};

// Life Scheduler Types
export type MemoryItemType = "reminder" | "location" | "preference" | "task";

export type MemoryItem = {
  id: string;
  type: MemoryItemType;
  content: string;
  time?: string;
  category?: string;
  createdAt: number;
};

// Log Types
export type LogType = "biometric" | "memory" | "alert" | "prompt" | "message";

export type SystemLog = {
  id: string;
  type: LogType;
  message: string;
  timestamp: number;
  data?: any;
};

// WebSocket Message Types
export type WebSocketMessage = {
  type: "biometric_update" | "chat_message" | "notification" | "log" | "memory" | "connection_status";
  data: any;
};

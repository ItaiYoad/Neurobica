import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (inherited from template, keeping for reference)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Memory items (for Life Scheduler)
export const memories = pgTable("memories", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  time: text("time"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMemorySchema = createInsertSchema(memories).pick({
  id: true,
  type: true,
  content: true,
  time: true,
  category: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

// Conversations (chat history)
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id),
  summary: text("summary"),
  emotionalTag: text("emotional_tag"),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  id: true,
  title: true,
  userId: true,
  summary: true,
  emotionalTag: true,
  lastMessageAt: true,
  messageCount: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Chat messages
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  emotionalContext: text("emotional_context"),
  memoryTriggerId: text("memory_trigger_id").references(() => memories.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  id: true,
  conversationId: true,
  role: true,
  content: true,
  emotionalContext: true,
  memoryTriggerId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// System logs
export const logs = pgTable("logs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  id: true,
  type: true,
  message: true,
  data: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Biometric data
export const biometricData = pgTable("biometric_data", {
  id: text("id").primaryKey(),
  heartRate: integer("heart_rate"),
  eegAlpha: integer("eeg_alpha"),
  emotionalStates: jsonb("emotional_states"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertBiometricDataSchema = createInsertSchema(biometricData).pick({
  id: true,
  heartRate: true,
  eegAlpha: true,
  emotionalStates: true,
});

export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type BiometricData = typeof biometricData.$inferSelect;

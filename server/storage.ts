import { 
  type InsertUser, 
  type User, 
  type InsertMessage,
  type Message,
  type InsertMemory,
  type Memory,
  type InsertLog,
  type Log,
  type InsertBiometricData,
  type BiometricData,
  type InsertConversation,
  type Conversation
} from "@shared/schema";
import { nanoid } from "nanoid";

// Storage interface
export interface IStorage {
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  getMessagesByConversation(conversationId: string, limit?: number): Promise<Message[]>;
  getMessageCount(conversationId: string): Promise<number>; // Added getMessageCount

  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;
  generateTitleFromMessage(message: string): Promise<string>;

  // Memory methods
  createMemory(memory: InsertMemory): Promise<Memory>;
  getMemory(id: string): Promise<Memory | undefined>;
  getAllMemories(): Promise<Memory[]>;
  updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory | undefined>;
  deleteMemory(id: string): Promise<void>;

  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;

  // Biometric data methods
  createBiometricData(data: InsertBiometricData): Promise<BiometricData>;
  getLatestBiometricData(): Promise<BiometricData | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<string, Message>;
  private memories: Map<string, Memory>;
  private logs: Map<string, Log>;
  private biometricData: Map<string, BiometricData>;
  private conversations: Map<string, Conversation>;

  currentUserId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.memories = new Map();
    this.logs = new Map();
    this.biometricData = new Map();
    this.conversations = new Map();
    this.currentUserId = 1;
  }

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = message.id || nanoid();
    const timestamp = new Date();

    const conversationId = typeof message.conversationId === 'string' ? message.conversationId : null;

    const newMessage: Message = {
      id,
      conversationId,
      role: message.role,
      content: message.content,
      timestamp,
      emotionalContext: message.emotionalContext || null,
      memoryTriggerId: message.memoryTriggerId || null
    };

    this.messages.set(id, newMessage);

    // If this message belongs to a conversation, update the conversation's lastMessageAt and messageCount
    if (message.conversationId) {
      const conversation = await this.getConversation(message.conversationId);
      if (conversation) {
        const messageCount = conversation.messageCount || 0;
        await this.updateConversation(message.conversationId, {
          lastMessageAt: timestamp,
          messageCount: messageCount + 1,
          // If this is the first user message, generate a title
          ...(message.role === 'user' && messageCount === 0 ? { 
            title: await this.generateTitleFromMessage(message.content),
            emotionalTag: message.emotionalContext || undefined
          } : {})
        });
      }
    }

    return newMessage;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getMessagesByConversation(conversationId: string, limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
  }

  async getMessageCount(conversationId: string): Promise<number> { // Added getMessageCount implementation
    return this.messages.values().filter(msg => msg.conversationId === conversationId).length;
  }

  // Conversation methods
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = conversation.id || nanoid();
    const now = new Date();

    const newConversation: Conversation = {
      id,
      title: conversation.title || "New Conversation",
      userId: conversation.userId || null,
      summary: conversation.summary || null,
      emotionalTag: conversation.emotionalTag || null,
      lastMessageAt: conversation.lastMessageAt || null,
      messageCount: conversation.messageCount || 0,
      createdAt: now,
      updatedAt: now
    };

    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => {
        // Sort by lastMessageAt if available, otherwise by updatedAt
        const aTime = a.lastMessageAt ? a.lastMessageAt.getTime() : a.updatedAt.getTime();
        const bTime = b.lastMessageAt ? b.lastMessageAt.getTime() : b.updatedAt.getTime();
        return bTime - aTime;
      });
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updatedConversation: Conversation = {
      ...conversation,
      ...updates,
      id,
      updatedAt: new Date()
    };

    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);

    // Delete all messages associated with this conversation
    const allMessages = Array.from(this.messages.entries());
    allMessages.forEach(([msgId, message]) => {
      if (message.conversationId === id) {
        this.messages.delete(msgId);
      }
    });
  }

  async generateTitleFromMessage(message: string): Promise<string> {
    // Generate a short title from the message (3-5 words)
    if (!message || message.trim() === '') {
      return "New Conversation";
    }

    // Just take the first few words, up to 30 characters
    const words = message.trim().split(/\s+/);
    let title = words.slice(0, 5).join(' ');

    if (title.length > 30) {
      title = title.substring(0, 27) + '...';
    }

    return title;
  }

  // Memory methods
  async createMemory(memory: InsertMemory): Promise<Memory> {
    const id = memory.id || nanoid();
    const createdAt = new Date();

    const newMemory: Memory = {
      id,
      type: memory.type,
      content: memory.content,
      time: memory.time || null,
      category: memory.category || null,
      createdAt
    };

    this.memories.set(id, newMemory);
    return newMemory;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async getAllMemories(): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory | undefined> {
    const existingMemory = this.memories.get(id);

    if (!existingMemory) {
      return undefined;
    }

    const updatedMemory: Memory = {
      ...existingMemory,
      ...memory,
      id,
    };

    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  async deleteMemory(id: string): Promise<void> {
    this.memories.delete(id);
  }

  // Log methods
  async createLog(log: InsertLog): Promise<Log> {
    const id = log.id || nanoid();
    const timestamp = new Date();

    const newLog: Log = {
      id,
      type: log.type,
      message: log.message,
      data: log.data || null,
      timestamp
    };

    this.logs.set(id, newLog);
    return newLog;
  }

  async getLogs(limit: number = 20): Promise<Log[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Biometric data methods
  async createBiometricData(data: InsertBiometricData): Promise<BiometricData> {
    const id = data.id || nanoid();
    const timestamp = new Date();

    const newData: BiometricData = {
      id,
      timestamp,
      heartRate: data.heartRate || null,
      eegAlpha: data.eegAlpha || null,
      emotionalStates: data.emotionalStates || null
    };

    this.biometricData.set(id, newData);
    return newData;
  }

  async getLatestBiometricData(): Promise<BiometricData | undefined> {
    return Array.from(this.biometricData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }
}

// Create and export storage instance
export const storage = new MemStorage();
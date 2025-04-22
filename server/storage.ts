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
  type BiometricData
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
  getConversations(): Promise<any[]>; // Added conversation methods
  createConversation(title: string): Promise<any>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<string, Message>;
  private memories: Map<string, Memory>;
  private logs: Map<string, Log>;
  private biometricData: Map<string, BiometricData>;
  private conversations: any[]; // Added conversations array

  currentUserId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.memories = new Map();
    this.logs = new Map();
    this.biometricData = new Map();
    this.conversations = []; // Initialize conversations array
    this.currentUserId = 1;
  }

  // User methods
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

    const newMessage: Message = {
      id,
      role: message.role,
      content: message.content,
      timestamp,
      emotionalContext: message.emotionalContext || null,
      memoryTriggerId: message.memoryTriggerId || null
    };

    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
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

  async getConversations(): Promise<any[]> {
    return this.conversations;
  }

  async createConversation(title: string, initialPrompt?: string): Promise<any> {
    const conversation = {
      id: nanoid(),
      title,
      timestamp: Date.now(),
      emotionalStates: [],
      isHighlighted: false,
      folder: null,
      messages: initialPrompt ? [{
        id: nanoid(),
        role: 'assistant',
        content: initialPrompt,
        timestamp: Date.now()
      }] : []
    };
    this.conversations.unshift(conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<any>): Promise<any> {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.conversations[index] = {
      ...this.conversations[index],
      ...updates
    };
    return this.conversations[index];
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations = this.conversations.filter(c => c.id !== id);
  }

  async getConversation(id: string): Promise<any> {
    return this.conversations.find(c => c.id === id);
  }
}

// Create and export storage instance
export const storage = new MemStorage();
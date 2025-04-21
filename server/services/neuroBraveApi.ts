/**
 * NeuroBrave API Service
 * 
 * Handles authentication and communication with the NeuroBrave API
 * for accessing real-time biometric data from connected devices.
 */

import axios from 'axios';
import { nanoid } from 'nanoid';
import { storage } from '../storage';
import WebSocket from 'ws';
import { BiometricData, EmotionalState } from '@/types';

// Configuration from customer_config.json
interface NeuroBraveConfig {
  email: string;
  password: string;
  verboseSocketLog: boolean;
}

// Configuration for each user from hia_config.json
interface UserConfig {
  accountId: string;
  username: string;
  userPassword: string;
  hiaId: string;
  verboseSocketLog: boolean;
}

// Authentication token & session management
interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export class NeuroBraveApiService {
  private config: NeuroBraveConfig;
  private userConfigs: Map<string, UserConfig>;
  private authSession: AuthSession | null = null;
  private userSessions: Map<string, AuthSession> = new Map();
  private apiBaseUrl = 'https://api.neurospeed.io'; // Replace with actual NeuroBrave API URL
  private customerSocket: WebSocket | null = null;
  private userSockets: Map<string, WebSocket> = new Map();
  private connectedDevices: Map<string, any> = new Map();
  private dataCallbacks: Array<(data: any) => void> = [];

  constructor(config: NeuroBraveConfig) {
    this.config = config;
    this.userConfigs = new Map();
  }

  /**
   * Initialize the API service with customer credentials
   */
  public async initialize(): Promise<boolean> {
    try {
      // Log the initialization attempt
      await storage.createLog({
        id: nanoid(),
        type: 'biometric',
        message: 'Initializing NeuroBrave API connection',
        data: { timestamp: new Date() }
      });

      // Authenticate with the NeuroBrave API
      const authenticated = await this.authenticateAsCustomer();
      
      if (authenticated) {
        // Setup WebSocket connection for real-time data
        this.setupCustomerWebSocket();
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to initialize NeuroBrave API:', error);
      
      await storage.createLog({
        id: nanoid(),
        type: 'alert',
        message: `NeuroBrave API initialization error: ${error.message || 'Unknown error'}`,
        data: { error: error.toString() }
      });
      
      return false;
    }
  }

  /**
   * Add a user configuration for accessing user-specific data
   */
  public addUserConfig(userId: string, config: UserConfig): void {
    this.userConfigs.set(userId, config);
  }

  /**
   * Authenticate with the NeuroBrave API using customer credentials
   */
  private async authenticateAsCustomer(): Promise<boolean> {
    try {
      // This is a mock implementation - would be replaced with actual API calls
      const response = await axios.post(`${this.apiBaseUrl}/auth/login`, {
        email: this.config.email,
        password: this.config.password
      });

      if (response.status === 200 && response.data.token) {
        this.authSession = {
          token: response.data.token,
          userId: response.data.userId,
          expiresAt: Date.now() + (response.data.expiresIn * 1000)
        };
        
        await storage.createLog({
          id: nanoid(),
          type: 'biometric',
          message: 'Successfully authenticated with NeuroBrave API',
          data: { userId: response.data.userId }
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      await storage.createLog({
        id: nanoid(),
        type: 'alert',
        message: `NeuroBrave API authentication error: ${error.message || 'Unknown error'}`,
        data: { error: error.toString() }
      });
      
      return false;
    }
  }

  /**
   * Authenticate as a specific user to access their data
   */
  private async authenticateAsUser(userId: string): Promise<boolean> {
    const userConfig = this.userConfigs.get(userId);
    
    if (!userConfig) {
      console.error(`No configuration found for user ${userId}`);
      return false;
    }
    
    try {
      // Mock implementation - would be replaced with actual API calls
      const response = await axios.post(`${this.apiBaseUrl}/auth/login/user`, {
        username: userConfig.username,
        password: userConfig.userPassword,
        accountId: userConfig.accountId
      });
      
      if (response.status === 200 && response.data.token) {
        this.userSessions.set(userId, {
          token: response.data.token,
          userId: response.data.userId,
          expiresAt: Date.now() + (response.data.expiresIn * 1000)
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error(`User authentication failed for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Set up WebSocket connection for customer-level data
   */
  private setupCustomerWebSocket(): void {
    if (!this.authSession) {
      console.error('Cannot set up WebSocket without authentication');
      return;
    }

    // Mock WebSocket setup - would be replaced with actual WebSocket implementation
    this.customerSocket = new WebSocket(`wss://ws.neurospeed.io/customer-room`);
    
    this.customerSocket.on('open', () => {
      console.log('Connected to NeuroBrave customer WebSocket');
      
      // Authenticate the WebSocket connection
      if (this.customerSocket && this.authSession) {
        this.customerSocket.send(JSON.stringify({
          type: 'authenticate',
          token: this.authSession.token
        }));
      }
    });
    
    this.customerSocket.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'hia_connection') {
          // Handle device connection
          this.handleDeviceConnection(message);
        } else if (message.type === 'hia_disconnection') {
          // Handle device disconnection
          this.handleDeviceDisconnection(message);
        }
        
        // Forward data to any registered callbacks
        this.dataCallbacks.forEach(callback => callback(message));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    this.customerSocket.on('close', () => {
      console.log('Disconnected from NeuroBrave customer WebSocket');
    });
    
    this.customerSocket.on('error', (error) => {
      console.error('NeuroBrave WebSocket error:', error);
    });
  }

  /**
   * Handle device connection event
   */
  private handleDeviceConnection(event: any): void {
    const { username, hia_id, sensors } = event;
    
    console.log(`Device connected: User ${username}, HIA ${hia_id}, Sensors: ${Object.keys(sensors).join(', ')}`);
    
    // Store connected device info
    this.connectedDevices.set(`${username}:${hia_id}`, {
      username,
      hia_id,
      sensors,
      connectedAt: Date.now()
    });
    
    // Set up user-specific WebSocket for this device
    this.setupUserWebSocket(username);
  }

  /**
   * Handle device disconnection event
   */
  private handleDeviceDisconnection(event: any): void {
    const { username, hia_id } = event;
    
    console.log(`Device disconnected: User ${username}, HIA ${hia_id}`);
    
    // Remove device from connected devices
    this.connectedDevices.delete(`${username}:${hia_id}`);
    
    // Check if user has any other connected devices
    const userHasDevices = Array.from(this.connectedDevices.keys())
      .some(key => key.startsWith(`${username}:`));
    
    // If no more devices, disconnect from user WebSocket
    if (!userHasDevices) {
      const socket = this.userSockets.get(username);
      if (socket) {
        socket.close();
        this.userSockets.delete(username);
      }
    }
  }

  /**
   * Set up WebSocket connection for user-specific data
   */
  private async setupUserWebSocket(username: string): Promise<void> {
    // If already connected, do nothing
    if (this.userSockets.has(username)) {
      return;
    }
    
    // Authenticate as this user first
    const authenticated = await this.authenticateAsUser(username);
    
    if (!authenticated) {
      console.error(`Failed to authenticate as user ${username}`);
      return;
    }
    
    const userSession = this.userSessions.get(username);
    
    if (!userSession) {
      console.error(`No session found for user ${username}`);
      return;
    }
    
    // Connect to user-specific WebSocket
    const socket = new WebSocket(`wss://ws.neurospeed.io/user-room`);
    
    socket.on('open', () => {
      console.log(`Connected to NeuroBrave user WebSocket for ${username}`);
      
      // Authenticate the WebSocket connection
      socket.send(JSON.stringify({
        type: 'authenticate',
        token: userSession.token
      }));
    });
    
    socket.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.device_type === 'eeg') {
          // Process EEG data
          this.processEEGData(username, message);
        }
        
        // Forward data to any registered callbacks
        this.dataCallbacks.forEach(callback => callback({
          ...message,
          username
        }));
      } catch (error) {
        console.error('Error processing user WebSocket message:', error);
      }
    });
    
    socket.on('close', () => {
      console.log(`Disconnected from NeuroBrave user WebSocket for ${username}`);
      this.userSockets.delete(username);
    });
    
    socket.on('error', (error) => {
      console.error(`NeuroBrave user WebSocket error for ${username}:`, error);
    });
    
    this.userSockets.set(username, socket);
  }

  /**
   * Process EEG data from a user's device
   */
  private async processEEGData(username: string, data: any): Promise<void> {
    try {
      if (!data.output || !data.output.brainwave_power) {
        return;
      }
      
      // Extract different brainwave bands
      const { delta_wave, theta_wave, alpha_wave, beta_wave, gamma_wave } = data.output.brainwave_power;
      
      // Calculate average for each band
      const deltaAvg = this.calculateAverage(delta_wave);
      const thetaAvg = this.calculateAverage(theta_wave);
      const alphaAvg = this.calculateAverage(alpha_wave);
      const betaAvg = this.calculateAverage(beta_wave);
      const gammaAvg = this.calculateAverage(gamma_wave);
      
      // Extract additional cognitive metrics if available
      const cognitiveAnalysis = data.output.cognitive_analysis || {};
      const focusLevel = cognitiveAnalysis.soft_decision || 0.5;
      
      // Calculate emotional states
      const emotionalStates = this.calculateEmotionalStates(
        deltaAvg, thetaAvg, alphaAvg, betaAvg, gammaAvg, focusLevel
      );
      
      // Store in database
      await storage.createBiometricData({
        id: nanoid(),
        heartRate: data.heart_rate || null,
        eegAlpha: alphaAvg,
        emotionalStates: JSON.stringify(emotionalStates)
      });
      
      // Broadcast to all WebSocket clients
      if (global.wss) {
        global.wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "biometric_update",
              data: {
                heartRate: data.heart_rate || Math.floor(Math.random() * 20) + 60, // Fallback if heart rate not provided
                eegAlpha: alphaAvg,
                emotionalStates
              }
            }));
          }
        });
      }
    } catch (error: any) {
      console.error('Error processing EEG data:', error);
      
      await storage.createLog({
        id: nanoid(),
        type: 'alert',
        message: `Error processing EEG data: ${error.message || 'Unknown error'}`,
        data: { error: error.toString() }
      });
    }
  }

  /**
   * Calculate average value of an array
   */
  private calculateAverage(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate emotional states based on brainwave patterns
   */
  private calculateEmotionalStates(
    deltaAvg: number, 
    thetaAvg: number, 
    alphaAvg: number, 
    betaAvg: number, 
    gammaAvg: number,
    focusLevel: number
  ): EmotionalState[] {
    // Calculate engagement level based on beta/alpha ratio
    const engagementLevel = Math.min(100, Math.max(0, (betaAvg / alphaAvg) * 50));
    
    // Calculate stress level based on beta/alpha and beta/theta ratios
    const stressLevel = Math.min(100, Math.max(0, (betaAvg / alphaAvg + betaAvg / thetaAvg) * 25));
    
    // Calculate focus level based on provided focus metric, normalized to 0-100
    const normalizedFocusLevel = Math.min(100, Math.max(0, focusLevel * 100));
    
    // Determine emotional label based on stress level
    let emotionalLabel: "Calm" | "Stressed" | "Moderate" | "High" | "Low";
    let emotionalColor: "calm" | "alert" | "moderate" | "focused" | "engaged";
    
    if (stressLevel < 30) {
      emotionalLabel = "Calm";
      emotionalColor = "calm";
    } else if (stressLevel > 70) {
      emotionalLabel = "Stressed";
      emotionalColor = "alert";
    } else {
      emotionalLabel = "Moderate";
      emotionalColor = "moderate";
    }
    
    // Determine focus label based on focus level
    let focusLabel: "Calm" | "Stressed" | "Moderate" | "High" | "Low";
    let focusColor: "calm" | "alert" | "moderate" | "focused" | "engaged";
    
    if (normalizedFocusLevel > 70) {
      focusLabel = "High";
      focusColor = "focused";
    } else if (normalizedFocusLevel < 30) {
      focusLabel = "Low";
      focusColor = "calm";
    } else {
      focusLabel = "Moderate";
      focusColor = "moderate";
    }
    
    // Determine engagement label
    let engagementLabel: "Calm" | "Stressed" | "Moderate" | "High" | "Low";
    let engagementColor: "calm" | "alert" | "moderate" | "focused" | "engaged";
    
    if (engagementLevel > 70) {
      engagementLabel = "High";
      engagementColor = "engaged";
    } else if (engagementLevel < 30) {
      engagementLabel = "Low";
      engagementColor = "calm";
    } else {
      engagementLabel = "Moderate";
      engagementColor = "moderate";
    }
    
    return [
      {
        type: "emotional",
        level: stressLevel,
        label: emotionalLabel,
        color: emotionalColor
      },
      {
        type: "stress",
        level: stressLevel,
        label: emotionalLabel,
        color: emotionalColor
      },
      {
        type: "focus",
        level: normalizedFocusLevel,
        label: focusLabel,
        color: focusColor
      },
      {
        type: "engagement",
        level: engagementLevel,
        label: engagementLabel,
        color: engagementColor
      }
    ];
  }

  /**
   * Register a callback to receive data
   */
  public onData(callback: (data: any) => void): void {
    this.dataCallbacks.push(callback);
  }

  /**
   * Get a list of all connected devices
   */
  public getConnectedDevices(): any[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Get a list of all connected users
   */
  public getConnectedUsers(): string[] {
    const users = new Set<string>();
    
    for (const deviceKey of this.connectedDevices.keys()) {
      const username = deviceKey.split(':')[0];
      users.add(username);
    }
    
    return Array.from(users);
  }
}

// Create and export singleton instance
let neuroBraveApiService: NeuroBraveApiService | null = null;

export async function initializeNeuroBraveApi(config: NeuroBraveConfig): Promise<NeuroBraveApiService> {
  if (!neuroBraveApiService) {
    neuroBraveApiService = new NeuroBraveApiService(config);
    await neuroBraveApiService.initialize();
  }
  
  return neuroBraveApiService;
}

export function getNeuroBraveApiService(): NeuroBraveApiService | null {
  return neuroBraveApiService;
}
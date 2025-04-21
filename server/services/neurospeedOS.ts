/**
 * NeurospeedOS Integration Service
 * 
 * Handles integration with the NeurospeedOS platform to process and stream
 * biometric data from connected wearable devices (Apple Watch, Muse headband, etc.)
 */

import { nanoid } from 'nanoid';
import { storage } from '../storage';
import WebSocket from 'ws';
import { BiometricData, EmotionalState } from '@/types';

// Types for NeurospeedOS integration
interface NeurospeedConfig {
  accountId: string;
  username: string;
  userPassword: string;
  hiaId: string;
  verboseSocketLog: boolean;
}

interface SensorInfo {
  channelMap: string[];
  samplingFrequency: number;
}

interface BrainwavePower {
  deltaWave: number[];
  thetaWave: number[];
  alphaWave: number[];
  betaWave: number[];
  gammaWave: number[];
}

interface CognitiveAnalysis {
  softDecision: number;
  hardDecision: number;
}

interface EEGPayload {
  hiaId: string;
  streamId: string;
  deviceType: string;
  sensorInfo: SensorInfo;
  output: {
    brainwavePower: BrainwavePower;
    cognitiveAnalysis: CognitiveAnalysis;
  };
}

export class NeurospeedOSService {
  private config: NeurospeedConfig;
  private connected: boolean = false;
  private socket: WebSocket | null = null;
  private eegProcessingCallbacks: Array<(data: EEGPayload) => void> = [];
  private heartRateCallbacks: Array<(heartRate: number) => void> = [];
  private deviceConnectionCallbacks: Array<(data: any) => void> = [];
  private deviceDisconnectionCallbacks: Array<(data: any) => void> = [];
  private deltaWaveHistory: number[] = [];

  constructor(config: NeurospeedConfig) {
    this.config = config;
  }

  /**
   * Initialize the NeurospeedOS service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Log initialization
      await storage.createLog({
        id: nanoid(),
        type: 'biometric',
        message: 'Initializing NeurospeedOS service',
        data: { config: { username: this.config.username, hiaId: this.config.hiaId } }
      });

      // Connect to NeurospeedOS
      await this.connect();
      
      return this.connected;
    } catch (error: any) {
      console.error('Failed to initialize NeurospeedOS service:', error);
      
      await storage.createLog({
        id: nanoid(),
        type: 'alert',
        message: `NeurospeedOS initialization error: ${error.message || 'Unknown error'}`,
        data: { error: error.toString() }
      });
      
      return false;
    }
  }

  /**
   * Connect to NeurospeedOS WebSocket
   */
  private async connect(): Promise<void> {
    // This simulates authenticating with NeurospeedOS
    console.log('Authenticating with NeurospeedOS...');
    
    // In a real implementation, you would authenticate with the NeurospeedOS API
    // For now, we'll simulate the authentication
    
    // Connect to WebSocket for real-time data
    this.socket = new WebSocket('wss://ws.neurospeed.io/user-room');
    
    this.socket.on('open', () => {
      console.log('Connected to NeurospeedOS WebSocket');
      this.connected = true;
      
      // Authenticate the WebSocket connection
      this.socket?.send(JSON.stringify({
        type: 'authenticate',
        username: this.config.username,
        accountId: this.config.accountId,
        hiaId: this.config.hiaId
      }));
    });
    
    this.socket.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.deviceType?.toLowerCase() === 'eeg') {
          this.handleEEGData(message);
        } else if (message.deviceType?.toLowerCase() === 'watch') {
          this.handleWatchData(message);
        } else if (message.type === 'hia_connection') {
          this.handleDeviceConnection(message);
        } else if (message.type === 'hia_disconnection') {
          this.handleDeviceDisconnection(message);
        }
      } catch (error) {
        console.error('Error processing NeurospeedOS WebSocket message:', error);
      }
    });
    
    this.socket.on('close', () => {
      console.log('Disconnected from NeurospeedOS WebSocket');
      this.connected = false;
    });
    
    this.socket.on('error', (error) => {
      console.error('NeurospeedOS WebSocket error:', error);
    });
  }

  /**
   * Handle EEG data from NeurospeedOS
   */
  private handleEEGData(data: EEGPayload): void {
    try {
      // Extract brainwave data
      const brainwavePower = data.output.brainwavePower;
      const cognitiveAnalysis = data.output.cognitiveAnalysis;
      
      // Calculate average for delta wave
      const deltaWaveAvg = this.calculateAverage(brainwavePower.deltaWave);
      
      // Store in history for engagement index calculation
      this.deltaWaveHistory.push(deltaWaveAvg);
      if (this.deltaWaveHistory.length > 20) {
        this.deltaWaveHistory.shift();
      }
      
      // Calculate cognitive effort/engagement index based on Gvion, Shahaf (2021)
      // "Real-time monitoring of barriers to patient engagement for improved rehabilitation"
      let cognitiveEffortIndex = 0;
      if (this.deltaWaveHistory.length >= 3) {
        const mean = this.calculateAverage(this.deltaWaveHistory);
        const stdDev = this.calculateStandardDeviation(this.deltaWaveHistory);
        cognitiveEffortIndex = stdDev / mean;
      }
      
      // Call registered callbacks
      this.eegProcessingCallbacks.forEach(callback => callback(data));
      
      // Create biometric data entry with calculated engagement
      this.createBiometricDataEntry(
        cognitiveAnalysis.softDecision * 100, // Focus level
        deltaWaveAvg,
        this.calculateAverage(brainwavePower.alphaWave),
        cognitiveEffortIndex * 100 // Engagement level
      );
    } catch (error) {
      console.error('Error handling EEG data:', error);
    }
  }

  /**
   * Handle watch data (heart rate, etc.) from NeurospeedOS
   */
  private handleWatchData(data: any): void {
    try {
      if (data.heartRate) {
        this.heartRateCallbacks.forEach(callback => callback(data.heartRate));
      }
    } catch (error) {
      console.error('Error handling watch data:', error);
    }
  }

  /**
   * Handle device connection event
   */
  private handleDeviceConnection(data: any): void {
    console.log(`Device connected: ${data.deviceType} for user ${data.username}`);
    this.deviceConnectionCallbacks.forEach(callback => callback(data));
  }

  /**
   * Handle device disconnection event
   */
  private handleDeviceDisconnection(data: any): void {
    console.log(`Device disconnected: ${data.deviceType} for user ${data.username}`);
    this.deviceDisconnectionCallbacks.forEach(callback => callback(data));
  }

  /**
   * Create biometric data entry and broadcast updates
   */
  private async createBiometricDataEntry(
    focusLevel: number,
    deltaWaveAvg: number,
    alphaWaveAvg: number,
    engagementLevel: number
  ): Promise<void> {
    // Calculate emotional states
    const emotionalStates = this.calculateEmotionalStates(focusLevel, engagementLevel);
    
    // Store in database
    await storage.createBiometricData({
      id: nanoid(),
      heartRate: null, // Will be updated when watch data is received
      eegAlpha: alphaWaveAvg,
      emotionalStates: JSON.stringify(emotionalStates)
    });
    
    // Broadcast to all WebSocket clients
    if (global.wss) {
      global.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "biometric_update",
            data: {
              heartRate: Math.floor(Math.random() * 20) + 60, // Mock heart rate until watch data received
              eegAlpha: alphaWaveAvg,
              emotionalStates
            }
          }));
        }
      });
    }
  }

  /**
   * Register a callback for EEG data
   */
  public onEEGData(callback: (data: EEGPayload) => void): void {
    this.eegProcessingCallbacks.push(callback);
  }

  /**
   * Register a callback for heart rate data
   */
  public onHeartRateData(callback: (heartRate: number) => void): void {
    this.heartRateCallbacks.push(callback);
  }

  /**
   * Register a callback for device connection events
   */
  public onDeviceConnection(callback: (data: any) => void): void {
    this.deviceConnectionCallbacks.push(callback);
  }

  /**
   * Register a callback for device disconnection events
   */
  public onDeviceDisconnection(callback: (data: any) => void): void {
    this.deviceDisconnectionCallbacks.push(callback);
  }

  /**
   * Calculate average of values
   */
  private calculateAverage(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation of values
   */
  private calculateStandardDeviation(values: number[]): number {
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculate emotional states based on focus and engagement levels
   */
  private calculateEmotionalStates(focusLevel: number, engagementLevel: number): EmotionalState[] {
    // Determine stress level based on focus and engagement
    // Low focus + high engagement = stress
    // High focus + high engagement = flow state (positive)
    const stressLevel = Math.max(0, Math.min(100, engagementLevel - focusLevel + 50));
    
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
    
    if (focusLevel > 70) {
      focusLabel = "High";
      focusColor = "focused";
    } else if (focusLevel < 30) {
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
        level: focusLevel,
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
}

// Create and export singleton instance
let neurospeedOSService: NeurospeedOSService | null = null;

export async function initializeNeurospeedOS(config: NeurospeedConfig): Promise<NeurospeedOSService> {
  if (!neurospeedOSService) {
    neurospeedOSService = new NeurospeedOSService(config);
    await neurospeedOSService.initialize();
  }
  
  return neurospeedOSService;
}

export function getNeurospeedOSService(): NeurospeedOSService | null {
  return neurospeedOSService;
}
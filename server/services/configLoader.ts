/**
 * Configuration Loader
 * 
 * Handles loading configuration files for NeuroBrave and NeurospeedOS integration
 */

import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { storage } from '../storage';

// Configuration interfaces
export interface NeuroBraveConfig {
  email: string;
  password: string;
  verboseSocketLog: boolean;
}

export interface NeurospeedConfig {
  accountId: string;
  username: string;
  userPassword: string;
  hiaId: string;
  verboseSocketLog: boolean;
}

/**
 * Load NeuroBrave customer configuration from customer_config.json
 */
export async function loadNeuroBraveConfig(): Promise<NeuroBraveConfig | null> {
  try {
    const configPath = path.join(process.cwd(), 'config', 'customer_config.json');
    
    // Check if file exists
    try {
      await fs.access(configPath);
    } catch {
      console.log(`Config file not found at ${configPath}, creating directory if needed`);
      
      // Create config directory if it doesn't exist
      try {
        await fs.mkdir(path.join(process.cwd(), 'config'), { recursive: true });
      } catch (err) {
        console.error('Failed to create config directory:', err);
      }
      
      // Return null to indicate config file doesn't exist
      return null;
    }
    
    // Read config file
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    return {
      email: config.email || '',
      password: config.password || '',
      verboseSocketLog: config.Verbose_socket_log === 'True'
    };
  } catch (error: any) {
    console.error('Error loading NeuroBrave config:', error);
    
    await storage.createLog({
      id: nanoid(),
      type: 'alert',
      message: `Error loading NeuroBrave config: ${error.message || 'Unknown error'}`,
      data: { error: error.toString() }
    });
    
    return null;
  }
}

/**
 * Load NeurospeedOS configuration from hia_config1.json
 */
export async function loadNeurospeedConfig(): Promise<NeurospeedConfig | null> {
  try {
    const configPath = path.join(process.cwd(), 'config', 'hia_config1.json');
    
    // Check if file exists
    try {
      await fs.access(configPath);
    } catch {
      console.log(`Config file not found at ${configPath}, creating directory if needed`);
      
      // Create config directory if it doesn't exist
      try {
        await fs.mkdir(path.join(process.cwd(), 'config'), { recursive: true });
      } catch (err) {
        console.error('Failed to create config directory:', err);
      }
      
      // Return null to indicate config file doesn't exist
      return null;
    }
    
    // Read config file
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    return {
      accountId: config.account_id || '',
      username: config.username || '',
      userPassword: config.user_password || '',
      hiaId: config.HIA_ID || '',
      verboseSocketLog: config.Verbose_socket_log === 'True'
    };
  } catch (error: any) {
    console.error('Error loading NeurospeedOS config:', error);
    
    await storage.createLog({
      id: nanoid(),
      type: 'alert',
      message: `Error loading NeurospeedOS config: ${error.message || 'Unknown error'}`,
      data: { error: error.toString() }
    });
    
    return null;
  }
}

/**
 * Save NeuroBrave customer configuration to customer_config.json
 */
export async function saveNeuroBraveConfig(config: NeuroBraveConfig): Promise<boolean> {
  try {
    const configDir = path.join(process.cwd(), 'config');
    const configPath = path.join(configDir, 'customer_config.json');
    
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create config directory:', err);
    }
    
    // Format config for saving (match original format)
    const configData = {
      email: config.email,
      password: config.password,
      Verbose_socket_log: config.verboseSocketLog ? 'True' : 'False'
    };
    
    // Write config file
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf8');
    
    return true;
  } catch (error: any) {
    console.error('Error saving NeuroBrave config:', error);
    
    await storage.createLog({
      id: nanoid(),
      type: 'alert',
      message: `Error saving NeuroBrave config: ${error.message || 'Unknown error'}`,
      data: { error: error.toString() }
    });
    
    return false;
  }
}

/**
 * Save NeurospeedOS configuration to hia_config1.json
 */
export async function saveNeurospeedConfig(config: NeurospeedConfig): Promise<boolean> {
  try {
    const configDir = path.join(process.cwd(), 'config');
    const configPath = path.join(configDir, 'hia_config1.json');
    
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create config directory:', err);
    }
    
    // Format config for saving (match original format)
    const configData = {
      account_id: config.accountId,
      username: config.username,
      user_password: config.userPassword,
      HIA_ID: config.hiaId,
      Verbose_socket_log: config.verboseSocketLog ? 'True' : 'False'
    };
    
    // Write config file
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf8');
    
    return true;
  } catch (error: any) {
    console.error('Error saving NeurospeedOS config:', error);
    
    await storage.createLog({
      id: nanoid(),
      type: 'alert',
      message: `Error saving NeurospeedOS config: ${error.message || 'Unknown error'}`,
      data: { error: error.toString() }
    });
    
    return false;
  }
}
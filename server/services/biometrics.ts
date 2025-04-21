import { MemoryItemType } from "@/types";
import { storage } from "../storage";
import { nanoid } from "nanoid";

/**
 * Mock implementation of NeuroBrave NeurospeedOS API for biometric data processing
 * In a real implementation, this would connect to the actual NeurospeedOS API
 */

// Extract potential memories from text
export function extractMemoriesFromText(text: string): Array<{
  type: MemoryItemType;
  content: string;
  time?: string;
  category?: string;
}> {
  const memories: Array<{
    type: MemoryItemType;
    content: string;
    time?: string;
    category?: string;
  }> = [];
  
  // Memory patterns to look for
  const patterns = [
    // Reminders (e.g., "remind me to drink water")
    {
      regex: /remind me to (.+?)(?: at |every |tomorrow|tonight|in the morning|in the evening|in the afternoon|at night|$)/i,
      type: "reminder" as MemoryItemType,
      extractTime: (text: string) => {
        const timeMatch = text.match(/ (at|every) ([0-9]{1,2}(?::[0-9]{2})?(?: ?[ap]m)?|morning|evening|afternoon|night)/i);
        return timeMatch ? timeMatch[2] : undefined;
      }
    },
    // Locations (e.g., "my wallet is in the kitchen")
    {
      regex: /my (.+?) (?:is|are) (?:in|on|at) (.+?)(?:\.|\,|\!|\?|$)/i,
      type: "location" as MemoryItemType,
      formatContent: (match: RegExpMatchArray) => `${match[1]} is in ${match[2]}`
    },
    // Preferences (e.g., "I like to drink coffee in the morning")
    {
      regex: /I (?:like|love|prefer|enjoy) (.+?)(?:\.|\,|\!|\?|$)/i,
      type: "preference" as MemoryItemType
    }
  ];
  
  // Check each pattern against the text
  patterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    
    if (match) {
      const memory: {
        type: MemoryItemType;
        content: string;
        time?: string;
        category?: string;
      } = {
        type: pattern.type,
        content: pattern.formatContent ? pattern.formatContent(match) : match[1],
        category: "Personal"
      };
      
      // Extract time if applicable
      if (pattern.extractTime) {
        memory.time = pattern.extractTime(text);
      }
      
      memories.push(memory);
    }
  });
  
  return memories;
}

// Classify emotional state based on biometric data
export async function classifyEmotionalState(
  heartRate: number, 
  eegAlpha: number
): Promise<{ 
  type: string; 
  level: number; 
  label: string; 
  color: string;
}> {
  // Simple threshold-based classifier
  // In a real implementation, this would use NeurospeedOS API's classification
  
  // Stress is inversely correlated with HRV and directly with HR
  const stressLevel = Math.min(100, Math.max(0, 
    (heartRate > 80 ? (heartRate - 60) * 2 : 0) +
    (eegAlpha < 8 ? (8 - eegAlpha) * 15 : 0)
  ));
  
  // Focus tends to correlate with moderate EEG alpha activity
  const focusLevel = Math.min(100, Math.max(0,
    100 - Math.abs(eegAlpha - 10) * 15
  ));
  
  // Define emotional state based on stress level primarily
  let emotionalType = "emotional";
  let emotionalLevel = stressLevel;
  let emotionalLabel = "";
  let emotionalColor = "";
  
  if (stressLevel < 33) {
    emotionalLabel = "Calm";
    emotionalColor = "calm";
  } else if (stressLevel < 66) {
    emotionalLabel = "Moderate";
    emotionalColor = "moderate";
  } else {
    emotionalLabel = "Stressed";
    emotionalColor = "alert";
  }
  
  // Log the classification
  await storage.createLog({
    id: nanoid(),
    type: "biometric",
    message: `Emotional state classified: ${emotionalLabel} (${emotionalLevel})`,
    data: { heartRate, eegAlpha, stressLevel, focusLevel }
  });
  
  return {
    type: emotionalType,
    level: emotionalLevel,
    label: emotionalLabel,
    color: emotionalColor
  };
}

// Simulate biometric data for testing
export async function simulateBiometricData() {
  // Generate random heart rate between 60-100
  const heartRate = Math.floor(Math.random() * 40) + 60;
  
  // Generate random EEG alpha between 5-15
  const eegAlpha = parseFloat((Math.random() * 10 + 5).toFixed(1));
  
  // Classify the emotional state
  const emotionalState = await classifyEmotionalState(heartRate, eegAlpha);
  
  // Create stress level state
  const stressLevel = emotionalState.level;
  const stressState = {
    type: "stress",
    level: stressLevel,
    label: stressLevel < 33 ? "Low" : stressLevel < 66 ? "Moderate" : "High",
    color: stressLevel < 33 ? "calm" : stressLevel < 66 ? "moderate" : "alert"
  };
  
  // Create focus level state
  const focusLevel = Math.min(100, Math.max(0, 100 - stressLevel / 2 + Math.random() * 20));
  const focusState = {
    type: "focus",
    level: focusLevel,
    label: focusLevel < 33 ? "Low" : focusLevel < 66 ? "Moderate" : "High",
    color: focusLevel < 33 ? "moderate" : focusLevel < 66 ? "moderate" : "focused"
  };
  
  // Store the biometric data
  await storage.createBiometricData({
    id: nanoid(),
    heartRate,
    eegAlpha,
    emotionalStates: [emotionalState, stressState, focusState]
  });
  
  return {
    heartRate,
    eegAlpha,
    emotionalStates: [emotionalState, stressState, focusState]
  };
}

import { BiometricData, EmotionalState } from "@/types";

/**
 * Simulate biometric data changes for development/testing
 */
export function simulateBiometricData(
  currentData: BiometricData,
  currentStates: EmotionalState[]
): { 
  biometricData: BiometricData, 
  emotionalStates: EmotionalState[]
} {
  // Random fluctuations
  const heartRateChange = Math.random() > 0.5 ? 
    Math.random() * 3 : -Math.random() * 3;
  
  const eegAlphaChange = Math.random() > 0.5 ? 
    Math.random() * 0.5 : -Math.random() * 0.5;
  
  // Update heartRate but keep within realistic bounds
  const newHeartRate = Math.max(
    60, 
    Math.min(100, currentData.heartRate + heartRateChange)
  );
  
  // Update eegAlpha but keep within realistic bounds
  const newEegAlpha = Math.max(
    5, 
    Math.min(15, currentData.eegAlpha + eegAlphaChange)
  );
  
  // Create slightly modified emotional states
  const newEmotionalStates = currentStates.map(state => {
    // Random change
    const levelChange = Math.random() > 0.7 ? 
      Math.random() * 10 - 5 : 0;
    
    // Calculate new level bounded between 0-100
    let newLevel = Math.max(0, Math.min(100, state.level + levelChange));
    
    // Determine label and color based on type and level
    let label: EmotionalState["label"];
    let color: EmotionalState["color"];
    
    if (state.type === "emotional") {
      if (newLevel < 33) {
        label = "Calm";
        color = "calm";
      } else if (newLevel < 66) {
        label = "Moderate";
        color = "moderate";
      } else {
        label = "Stressed";
        color = "alert";
      }
    } else if (state.type === "stress") {
      if (newLevel < 33) {
        label = "Low";
        color = "calm";
      } else if (newLevel < 66) {
        label = "Moderate";
        color = "moderate";
      } else {
        label = "High";
        color = "alert";
      }
    } else if (state.type === "focus") {
      if (newLevel < 33) {
        label = "Low";
        color = "moderate";
      } else if (newLevel < 66) {
        label = "Moderate";
        color = "moderate";
      } else {
        label = "High";
        color = "focused";
      }
    } else {
      // Default for other types
      if (newLevel < 33) {
        label = "Low";
        color = "moderate";
      } else if (newLevel < 66) {
        label = "Moderate";
        color = "moderate";
      } else {
        label = "High";
        color = "engaged";
      }
    }
    
    return {
      ...state,
      level: newLevel,
      label,
      color
    };
  });
  
  return {
    biometricData: {
      heartRate: Math.round(newHeartRate),
      eegAlpha: parseFloat(newEegAlpha.toFixed(1)),
      emotionalStates: newEmotionalStates,
      timestamp: Date.now()
    },
    emotionalStates: newEmotionalStates
  };
}

/**
 * Extract emotional context for LLM based on biometric data
 */
export function extractEmotionalContextForLLM(
  emotionalStates: EmotionalState[]
): string {
  const emotionalState = emotionalStates.find(state => state.type === "emotional");
  const stressState = emotionalStates.find(state => state.type === "stress");
  const focusState = emotionalStates.find(state => state.type === "focus");
  
  const contexts: string[] = [];
  
  if (emotionalState) {
    contexts.push(`Emotion: ${emotionalState.label}`);
  }
  
  if (stressState) {
    contexts.push(`Stress: ${stressState.label}`);
  }
  
  if (focusState) {
    contexts.push(`Focus: ${focusState.label}`);
  }
  
  return contexts.join(', ');
}

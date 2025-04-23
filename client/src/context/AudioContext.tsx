import React, { createContext, useContext, useState, useEffect } from 'react';

type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

export interface AudioSettings {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  defaultVoice: string;
  defaultSpeed: number;
  voiceOptions: VoiceOption[];
}

interface AudioContextType {
  settings: AudioSettings;
  isLoading: boolean;
  error: string | null;
  toggleTTS: () => void;
  toggleSTT: () => void;
  setDefaultVoice: (voice: string) => void;
  setDefaultSpeed: (speed: number) => void;
  saveSettings: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>({
    ttsEnabled: true,
    sttEnabled: true,
    defaultVoice: 'nova',
    defaultSpeed: 1.0,
    voiceOptions: [
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
      { id: 'echo', name: 'Echo', description: 'Clear and expressive' },
      { id: 'fable', name: 'Fable', description: 'Warm and narrative' },
      { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
      { id: 'nova', name: 'Nova', description: 'Friendly and conversational' },
      { id: 'shimmer', name: 'Shimmer', description: 'Gentle and soothing' },
    ]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load settings from API on mount
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // Fetch current settings from the API
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/audio/settings');
      
      if (!response.ok) {
        throw new Error('Failed to load audio settings');
      }
      
      const data = await response.json();
      setSettings(prevSettings => ({
        ...prevSettings,
        ...data
      }));
    } catch (err: any) {
      console.error('Error loading audio settings:', err);
      setError(err.message || 'Failed to load audio settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle text-to-speech
  const toggleTTS = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ttsEnabled: !prevSettings.ttsEnabled
    }));
  };
  
  // Toggle speech-to-text
  const toggleSTT = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      sttEnabled: !prevSettings.sttEnabled
    }));
  };
  
  // Set default voice
  const setDefaultVoice = (voice: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      defaultVoice: voice
    }));
  };
  
  // Set default speed
  const setDefaultSpeed = (speed: number) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      defaultSpeed: speed
    }));
  };
  
  // Save settings to the API
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/audio/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ttsEnabled: settings.ttsEnabled,
          sttEnabled: settings.sttEnabled,
          defaultVoice: settings.defaultVoice,
          defaultSpeed: settings.defaultSpeed
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      // Success - no need to update state as we're already in sync
    } catch (err: any) {
      console.error('Error saving settings:', err);
      throw err; // Re-throw to handle in the UI
    }
  };
  
  const contextValue = {
    settings,
    isLoading,
    error,
    toggleTTS,
    toggleSTT,
    setDefaultVoice,
    setDefaultSpeed,
    saveSettings
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return context;
}
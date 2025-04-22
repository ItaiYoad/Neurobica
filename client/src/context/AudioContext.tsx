import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

interface SpeedOption {
  value: number;
  label: string;
}

interface AudioSettings {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  voiceOptions: VoiceOption[];
  defaultVoice: string;
  speedOptions: SpeedOption[];
  defaultSpeed: number;
}

interface AudioContextType {
  settings: AudioSettings;
  isLoading: boolean;
  error: string | null;
  toggleTTS: (enabled: boolean) => void;
  toggleSTT: (enabled: boolean) => void;
  setDefaultVoice: (voice: string) => void;
  setDefaultSpeed: (speed: number) => void;
  saveSettings: () => Promise<void>;
}

const defaultSettings: AudioSettings = {
  ttsEnabled: true,
  sttEnabled: true,
  voiceOptions: [
    { id: 'nova', name: 'Nova', description: 'Warm, natural voice' },
    { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced voice' },
    { id: 'echo', name: 'Echo', description: 'Deeper, authoritative voice' },
    { id: 'fable', name: 'Fable', description: 'Expressive, narrative-focused voice' },
    { id: 'onyx', name: 'Onyx', description: 'Versatile, professional voice' },
    { id: 'shimmer', name: 'Shimmer', description: 'Clear, optimistic voice' }
  ],
  defaultVoice: 'nova',
  speedOptions: [
    { value: 0.8, label: 'Slow' },
    { value: 1.0, label: 'Normal' },
    { value: 1.2, label: 'Fast' }
  ],
  defaultSpeed: 1.0
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/audio/settings');
        
        if (!response.ok) {
          throw new Error('Failed to load audio settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (err: any) {
        console.error('Error loading audio settings:', err);
        setError(err.message || 'Failed to load audio settings');
        // Keep using default settings on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Toggle Text-to-Speech
  const toggleTTS = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, ttsEnabled: enabled }));
    setIsDirty(true);
  };
  
  // Toggle Speech-to-Text
  const toggleSTT = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, sttEnabled: enabled }));
    setIsDirty(true);
  };
  
  // Set default voice
  const setDefaultVoice = (voice: string) => {
    setSettings(prev => ({ ...prev, defaultVoice: voice }));
    setIsDirty(true);
  };
  
  // Set default speed
  const setDefaultSpeed = (speed: number) => {
    setSettings(prev => ({ ...prev, defaultSpeed: speed }));
    setIsDirty(true);
  };
  
  // Save settings to server
  const saveSettings = async () => {
    if (!isDirty) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/audio/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttsEnabled: settings.ttsEnabled,
          sttEnabled: settings.sttEnabled,
          defaultVoice: settings.defaultVoice,
          defaultSpeed: settings.defaultSpeed,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save audio settings');
      }
      
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error saving audio settings:', err);
      setError(err.message || 'Failed to save audio settings');
      throw err;
    }
  };
  
  return (
    <AudioContext.Provider
      value={{
        settings,
        isLoading,
        error,
        toggleTTS,
        toggleSTT,
        setDefaultVoice,
        setDefaultSpeed,
        saveSettings,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return context;
};

export default AudioContext;
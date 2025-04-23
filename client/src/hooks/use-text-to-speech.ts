import { useState, useCallback, useRef, useEffect } from 'react';

interface TextToSpeechOptions {
  voice?: string;
  speed?: number;
}

interface UseTextToSpeechProps {
  defaultOptions?: TextToSpeechOptions;
  onError?: (error: string) => void;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
  isPending: boolean;
}

const useTextToSpeech = ({
  defaultOptions = { voice: 'nova', speed: 1.0 },
  onError,
  onPlayStart,
  onPlayEnd,
}: UseTextToSpeechProps = {}): UseTextToSpeechReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element on client side only
  useEffect(() => {
    audioRef.current = new Audio();
    
    // Set up audio element event handlers
    const audioElement = audioRef.current;
    
    const handlePlayStart = () => {
      setIsPlaying(true);
      if (onPlayStart) onPlayStart();
    };
    
    const handlePlayEnd = () => {
      setIsPlaying(false);
      if (onPlayEnd) onPlayEnd();
    };
    
    audioElement.addEventListener('play', handlePlayStart);
    audioElement.addEventListener('ended', handlePlayEnd);
    audioElement.addEventListener('pause', handlePlayEnd);
    audioElement.addEventListener('error', handlePlayEnd);
    
    return () => {
      audioElement.removeEventListener('play', handlePlayStart);
      audioElement.removeEventListener('ended', handlePlayEnd);
      audioElement.removeEventListener('pause', handlePlayEnd);
      audioElement.removeEventListener('error', handlePlayEnd);
      
      // Stop any ongoing playback
      if (audioElement.src) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [onPlayStart, onPlayEnd]);
  
  const speak = useCallback(async (text: string, options?: TextToSpeechOptions) => {
    if (!text || text.trim() === '') {
      return;
    }
    
    // Stop any existing audio
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setError(null);
    setIsPending(true);
    
    try {
      // Merge default options with provided options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Create request parameters
      const params = new URLSearchParams();
      if (mergedOptions.voice) params.append('voice', mergedOptions.voice);
      if (mergedOptions.speed) params.append('speed', mergedOptions.speed.toString());
      
      // Get base URL
      const baseUrl = '/api/audio/speech';
      const url = `${baseUrl}?${params.toString()}`;
      
      // Make POST request to get audio stream
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }
      
      // Create blob from response
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Set audio source and play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        
        // Clean up blob URL when audio finishes
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error generating speech';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsPending(false);
    }
  }, [defaultOptions, onError]);
  
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);
  
  return {
    speak,
    stop,
    isPlaying,
    error,
    isPending,
  };
};

export default useTextToSpeech;
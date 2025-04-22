import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/context/AudioContext';
import { toast } from '@/hooks/use-toast';

interface TextPlayerProps {
  text: string;
  autoPlay?: boolean;
  showButton?: boolean;
  className?: string;
}

export default function TextPlayer({ 
  text, 
  autoPlay = false, 
  showButton = false,
  className = '' 
}: TextPlayerProps) {
  const { settings } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Effect for auto-play when the component mounts or text changes
  useEffect(() => {
    if (text && autoPlay && settings.ttsEnabled) {
      playAudio();
    }
    
    // Clean up audio when component unmounts or text changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }
      }
    };
  }, [text, autoPlay]);
  
  // Stop playing when TTS is disabled globally
  useEffect(() => {
    if (!settings.ttsEnabled && isPlaying) {
      stopAudio();
    }
  }, [settings.ttsEnabled]);
  
  const playAudio = async () => {
    // Don't do anything if TTS is disabled
    if (!settings.ttsEnabled) return;
    
    // If we already have audio loaded, play it
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    
    // Otherwise, fetch new audio
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: settings.defaultVoice,
          speed: settings.defaultSpeed
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate speech');
      }
      
      // Get audio as blob
      const audioBlob = await response.blob();
      
      // Create object URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Create audio element
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        
        // Add event listeners
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          toast({
            title: 'Playback error',
            description: 'Could not play the audio',
            variant: 'destructive'
          });
          setIsPlaying(false);
        });
      } else {
        audioRef.current.src = url;
      }
      
      // Play audio
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Error generating speech:', error);
      toast({
        title: 'Text-to-speech failed',
        description: error.message || 'Failed to convert text to speech',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };
  
  // If TTS is disabled and not forced to show button, don't render anything
  if (!settings.ttsEnabled && !showButton) {
    return null;
  }
  
  // Otherwise render toggle button
  return (
    <span className={className}>
      {isLoading ? (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 rounded-full text-neutral-500"
          disabled
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : isPlaying ? (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-primary"
          onClick={stopAudio}
        >
          <Pause className="h-4 w-4" />
        </Button>
      ) : (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-primary"
          onClick={toggleAudio}
          disabled={!settings.ttsEnabled && !showButton}
        >
          {settings.ttsEnabled ? <Play className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      )}
    </span>
  );
}
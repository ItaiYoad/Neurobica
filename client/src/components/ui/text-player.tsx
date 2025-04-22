
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
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

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
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
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

    setIsLoading(true);

    try {
      // Play silent audio to enable autoplay
      const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudioRef.current = silentAudio;
      await silentAudio.play().catch(() => {});
      silentAudio.pause();

      // If we already have audio loaded, play it
      if (audioUrl && audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      }

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

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      if (!audioRef.current) {
        audioRef.current = new Audio(url);
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

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Error generating speech:', error);
      if (!autoPlay) {
        toast({
          title: 'Text-to-speech failed',
          description: error.message || 'Failed to convert text to speech',
          variant: 'destructive'
        });
      }
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

  if (!settings.ttsEnabled && !showButton) {
    return null;
  }

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

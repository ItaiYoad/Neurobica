import React, { useEffect, useState } from 'react';
import { Play, Square, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import useTextToSpeech from '@/hooks/use-text-to-speech';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';

interface TextPlayerProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
  showButton?: boolean;
}

const TextPlayer: React.FC<TextPlayerProps> = ({
  text,
  autoPlay = false,
  className,
  showButton = true
}) => {
  const { settings, isLoading: isSettingsLoading } = useAudio();
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Apply settings when loaded
  useEffect(() => {
    if (!isSettingsLoading) {
      setIsEnabled(settings.ttsEnabled);
    }
  }, [settings.ttsEnabled, isSettingsLoading]);
  
  const {
    speak,
    stop,
    isPlaying,
    isPending,
    error
  } = useTextToSpeech({
    defaultOptions: {
      voice: settings.defaultVoice,
      speed: settings.defaultSpeed
    },
    onError: (errMsg) => {
      toast({
        title: 'Text-to-speech error',
        description: errMsg,
        variant: 'destructive'
      });
    }
  });
  
  // Auto-play when enabled and text changes
  useEffect(() => {
    if (autoPlay && text && isEnabled && !isPlaying && !isPending) {
      speak(text).catch(err => console.error('Failed to auto-play text:', err));
    }
  }, [text, autoPlay, isEnabled, speak, isPlaying, isPending]);
  
  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Text-to-speech error',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error]);
  
  // Don't render if disabled or no button to show
  if (!isEnabled || (!showButton && !isPlaying && !isPending)) return null;
  
  // Handle play/pause
  const handleClick = async () => {
    if (isPlaying) {
      stop();
    } else {
      try {
        await speak(text);
      } catch (err) {
        // Error is handled in the hook
        console.error('Failed to play text:', err);
      }
    }
  };
  
  return (
    <div className={cn("inline-flex items-center", className)}>
      {showButton && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8 flex items-center justify-center"
          onClick={handleClick}
          disabled={isPending || !text}
          title={isPlaying ? "Stop playback" : "Play text"}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Square className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}
      {isPlaying && (
        <div className="relative ml-2">
          <Volume2 
            className={cn(
              "h-4 w-4 text-primary animate-pulse", 
              !showButton && "ml-0"
            )} 
          />
          <span className="sr-only">Playing audio</span>
        </div>
      )}
    </div>
  );
};

export default TextPlayer;
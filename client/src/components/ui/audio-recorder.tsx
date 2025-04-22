import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import useSpeechToText from '@/hooks/use-speech-to-text';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  className?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onTranscription,
  className
}) => {
  const { settings, isLoading: isSettingsLoading } = useAudio();
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Apply settings when loaded
  useEffect(() => {
    if (!isSettingsLoading) {
      setIsEnabled(settings.sttEnabled);
    }
  }, [settings.sttEnabled, isSettingsLoading]);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    isProcessing,
    error
  } = useSpeechToText({
    onTranscription: (text) => {
      if (text.trim() === '') return;
      onTranscription(text);
    },
    onError: (errMsg) => {
      toast({
        title: 'Error recording audio',
        description: errMsg,
        variant: 'destructive'
      });
    }
  });
  
  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Speech recognition error',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error]);
  
  // If speech-to-text is disabled, don't render the component
  if (!isEnabled) return null;
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Button
        variant={isRecording ? "destructive" : "secondary"}
        size="icon"
        className={cn(
          "rounded-full h-10 w-10 flex items-center justify-center transition-all", 
          isRecording && "animate-pulse",
          isProcessing && "opacity-70 cursor-not-allowed"
        )}
        disabled={isProcessing}
        onClick={isRecording ? stopRecording : startRecording}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      {isRecording && (
        <div className="ml-2 text-xs font-medium text-muted-foreground">
          Recording...
        </div>
      )}
      {isProcessing && (
        <div className="ml-2 text-xs font-medium text-muted-foreground">
          Processing...
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
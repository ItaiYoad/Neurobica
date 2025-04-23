import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  className?: string;
}

export default function AudioRecorder({ onTranscription, className = '' }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Event handler for when data is available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Event handler for when recording stops
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
        } catch (error: any) {
          console.error('Error processing audio:', error);
          toast({
            title: 'Error processing audio',
            description: error.message || 'Failed to process recording',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
          
          // Stop all tracks in the stream to release the microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to use this feature',
        variant: 'destructive',
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob) => {
    // Create form data with audio blob
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    try {
      // Send to server for transcription
      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to transcribe audio');
      }
      
      const data = await response.json();
      
      // Call the callback with transcription
      if (data.success && data.transcription) {
        onTranscription(data.transcription);
      } else {
        throw new Error('No transcription data received');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: error.message || 'Could not convert your speech to text',
        variant: 'destructive',
      });
    }
  };

  return (
    <span className={className}>
      {isProcessing ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-neutral-500"
          disabled
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      ) : isRecording ? (
        <Button
          size="icon"
          variant="destructive"
          className="h-9 w-9 rounded-full"
          onClick={stopRecording}
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-primary"
          onClick={startRecording}
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </span>
  );
}
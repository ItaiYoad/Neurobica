import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechToTextProps {
  onTranscription?: (text: string) => void;
  language?: string;
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcription: string | null;
  isProcessing: boolean;
  error: string | null;
}

const useSpeechToText = ({
  onTranscription,
  language = 'en',
  onError,
}: UseSpeechToTextProps = {}): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Clean up resources when unmounting
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);
  
  const startRecording = useCallback(async () => {
    // Reset state
    setError(null);
    setTranscription(null);
    audioChunksRef.current = [];
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Close all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          return;
        }
        
        setIsProcessing(true);
        
        try {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          
          // Create FormData for API call
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.mp3');
          
          if (language) {
            formData.append('language', language);
          }
          
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
          setTranscription(data.transcription);
          
          // Notify parent component
          if (onTranscription) {
            onTranscription(data.transcription);
          }
        } catch (err: any) {
          const errorMessage = err?.message || 'Error processing audio';
          setError(errorMessage);
          
          if (onError) {
            onError(errorMessage);
          }
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      const errorMessage = err?.message || 'Error accessing microphone';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [language, onTranscription, onError]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);
  
  return {
    isRecording,
    startRecording,
    stopRecording,
    transcription,
    isProcessing,
    error,
  };
};

export default useSpeechToText;
import { useState, useRef, useEffect } from "react";
import { Mic, Send, Paperclip, Loader2 } from "lucide-react";
import AudioRecorder from "@/components/ui/audio-recorder";
import { toast } from "@/hooks/use-toast";
import { useAudio } from "@/context/AudioContext";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useAudio();

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTranscription = (text: string) => {
    if (text && text.trim()) {
      // Set the transcribed text in the input
      setMessage(text);
      
      // Optional: Auto-submit the transcribed text
      if (settings.sttEnabled && !isLoading) {
        onSendMessage(text);
        
        // Reset the message state after submission
        setTimeout(() => {
          setMessage("");
        }, 100);
      }
    }
  };

  const handleMicClick = () => {
    if (!settings.sttEnabled) {
      toast({
        title: "Speech recognition disabled",
        description: "Enable speech recognition in settings to use this feature.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form className="flex items-end space-x-2" onSubmit={handleSubmit}>
        <div className="flex-1 relative">
          <textarea 
            ref={textareaRef}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Type your message..."
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <button 
              type="button" 
              className="p-1.5 rounded-full hover:bg-neutral-100 text-gray-500 hover:text-gray-700"
              onClick={() => toast({
                title: "Attachment feature",
                description: "File attachments will be available in a future update."
              })}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            {settings.sttEnabled ? (
              <AudioRecorder 
                onTranscription={handleTranscription}
                className="inline-flex" 
              />
            ) : (
              <button 
                type="button"
                onClick={handleMicClick}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-gray-500 hover:text-gray-700"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <button 
          type="submit" 
          className={`px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center ${isLoading || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 mr-1.5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 mr-1.5" />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Mic, Send, MoreHorizontal, Loader2 } from "lucide-react";
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
    <div className="bg-white p-4 border-t w-full">
      <form className="flex items-end w-full" onSubmit={handleSubmit}>
        <div className="flex-1 relative">
          <div className="w-full bg-white border border-blue-100 rounded-full shadow-sm">
            <textarea 
              ref={textareaRef}
              className="w-full px-4 py-3 pr-32 focus:outline-none rounded-full resize-none overflow-hidden bg-transparent"
              placeholder="Type your message..."
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button 
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                onClick={() => toast({
                  title: "Menu",
                  description: "Menu options will be available in a future update."
                })}
              >
                <MoreHorizontal className="h-5 w-5" />
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
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
              
              <button 
                type="submit" 
                className={`p-2 border border-blue-100 rounded-full hover:bg-gray-50 ${isLoading || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 text-blue-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

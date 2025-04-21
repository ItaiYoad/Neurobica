import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form className="flex items-end space-x-2" onSubmit={handleSubmit}>
        <div className="flex-1 relative">
          <textarea 
            ref={textareaRef}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Type your message..."
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex space-x-1 text-neutral-mid">
            <button type="button" className="p-1.5 rounded-full hover:bg-neutral-light">
              <i className="fas fa-paperclip"></i>
            </button>
            <button type="button" className="p-1.5 rounded-full hover:bg-neutral-light">
              <i className="fas fa-microphone"></i>
            </button>
          </div>
        </div>
        <button 
          type="submit" 
          className={`px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || !message.trim()}
        >
          <i className="fas fa-paper-plane mr-1.5"></i>
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

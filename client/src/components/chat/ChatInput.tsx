"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Send } from "lucide-react";
import AudioRecorder from "@/components/ui/audio-recorder";
import { useAudio } from "@/context/AudioContext";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useAudio();

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [message]);

  const submit = () => {
    const txt = message.trim();
    if (!txt || isLoading) return;
    onSendMessage(txt);
    setMessage("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Dynamically pick a radius class
  const lineCount = message.split("\n").length;
  const radiusClass = (() => {
    if (lineCount === 1) return "rounded-full";
    if (lineCount === 2) return "rounded-3xl";
    if (lineCount === 3) return "rounded-2xl";
    if (lineCount === 4) return "rounded-2xl";
    if (lineCount === 5) return "rounded-xl";
    if (lineCount === 6) return "rounded-xl";
    return "rounded-lg";
  })();

  return (
    <div className="w-full px-4 bg-white pb-safe">
      <div
        className={`
          flex items-center space-x-2
          bg-white border border-gray-200
          ${radiusClass}
          px-4 py-2
        `}
      >
        <Plus className="h-5 w-5 text-gray-400" />

        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 bg-transparent resize-none overflow-hidden placeholder-gray-400 text-gray-900 focus:outline-none px-2 py-1"
          placeholder="Type here…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isLoading}
        />

        <div className="relative w-8 h-8 flex-shrink-0">
          {!message.trim() ? (
            <AudioRecorder
              onTranscription={(text) => {
                const t = text.trim();
                if (t && !isLoading) {
                  onSendMessage(t);
                  setTimeout(() => setMessage(""), 100);
                }
              }}
              className="absolute inset-0 text-gray-500"
            />
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isLoading}
              className="absolute inset-0 flex items-center justify-center text-blue-600 hover:bg-gray-100 rounded-full"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

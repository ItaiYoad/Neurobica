"use client";

import { Message } from "@/types";
import chatAssistantLogo from "@assets/Chat assistant logo.png";
import TextPlayer from "@/components/ui/text-player";
import { useAudio } from "@/context/AudioContext";
import { useEffect, useState } from "react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { settings } = useAudio();
  const [showAudio, setShowAudio] = useState(false);

  useEffect(() => {
    if (message.role === "assistant" && settings.ttsEnabled) {
      const timer = setTimeout(() => setShowAudio(true), 500);
      return () => clearTimeout(timer);
    }
  }, [message.role, settings.ttsEnabled]);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white p-3 rounded-lg shadow-sm max-w-3xl">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden"></div>
      <div className="bg-blue-50 p-3 rounded-lg shadow-sm max-w-3xl space-y-2">
        <p className="text-sm">{message.content}</p>
        {showAudio && (
          <TextPlayer
            text={message.content}
            autoPlay={settings.ttsEnabled}
            className="mt-1"
          />
        )}
        {message.emotionalContext && (
          <div className="text-xs text-neutral-mid">
            {message.emotionalContext.includes("calm") ? (
              <>
                I'm currently detecting that you're in a{" "}
                <span className="text-blue-400">calm</span> state.
              </>
            ) : (
              message.emotionalContext
            )}
          </div>
        )}
        {message.memoryTrigger && (
          <div
            className={`p-2 rounded-md border ${
              message.memoryTrigger.type === "reminder"
                ? "bg-secondary-light border-secondary-light"
                : "bg-accent-light border-accent-light"
            }`}
          >
            <div className="flex items-center space-x-2 text-sm">
              <i
                className={`fas ${
                  message.memoryTrigger.type === "reminder"
                    ? "fa-calendar-check text-secondary"
                    : "fa-brain text-accent"
                }`}
              />
              <span>
                <span className="font-medium">
                  {message.memoryTrigger.type === "reminder"
                    ? "Added to Life Scheduler:"
                    : "Added to memory:"}
                </span>{" "}
                {message.memoryTrigger.content}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

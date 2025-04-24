// ChatInterface.tsx
"use client";

import { useEffect, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { Skeleton } from "@/components/ui/skeleton";
import NeurobicaLogoFull from "@assets/Neurobica logo full.png";
import { Calendar, Brain, Heart, Clock, Sparkles, Search } from "lucide-react";

// Static templates for a fresh chat
const INITIAL_SUGGESTIONS = [
  {
    icon: Calendar,
    text: "Help me plan my day",
    description: "I can help you organize your schedule and prioritize tasks.",
  },
  {
    icon: Brain,
    text: "Track my biometric data",
    description: "Let's monitor your stress levels and cognitive performance.",
  },
  {
    icon: Heart,
    text: "Recommend mindfulness exercises",
    description: "I can suggest activities based on your emotional state.",
  },
  {
    icon: Clock,
    text: "Schedule reminders",
    description: "I'll help you set up and manage important reminders.",
  },
  {
    icon: Sparkles,
    text: "Analyze my mood patterns",
    description: "Let me help identify trends in your emotional data.",
  },
  {
    icon: Search,
    text: "Search for emotion research",
    description: "I can find scientific studies about emotional intelligence.",
  },
];

export function ChatInterface() {
  const {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    isLoadingMessages,
    startNewConversation,
    activeConversation,
    activeConversationId,
    refetchMessages,
  } = useChat();

  // Listen for external conversation selection
  useEffect(() => {
    function onSelect(e: CustomEvent<{ id: string; messages: any[] }>) {
      if (e.detail.messages?.length) {
        const formatted = e.detail.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: +new Date(m.timestamp),
          emotionalContext: m.emotionalContext,
          memoryTrigger: m.memoryTrigger,
          conversationId: m.conversationId,
        }));
        setMessages(formatted);
      } else {
        refetchMessages?.();
      }
    }
    window.addEventListener("conversation-selected", onSelect as any);
    return () => {
      window.removeEventListener("conversation-selected", onSelect as any);
    };
  }, [refetchMessages, setMessages]);

  // Clear-on-flag for new chat
  useEffect(() => {
    function checkClear() {
      if (localStorage.getItem("tempClearMessages") === "true") {
        localStorage.removeItem("tempClearMessages");
        startNewConversation();
      }
    }
    checkClear();
    const id = setInterval(checkClear, 500);
    return () => clearInterval(id);
  }, [startNewConversation]);

  const handleSend = useCallback(
    (content: string) => sendMessage(content),
    [sendMessage],
  );

  const isNewChat =
    !activeConversation && messages.length === 0 && !isLoadingMessages;

  return (
    <div
      key={activeConversationId ?? "new-chat"}
      className="flex flex-col h-full w-full"
    >
      {/* ─── Scrollable Content ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingMessages && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {isNewChat && (
          <div className="flex flex-col items-center max-w-3xl mx-auto">
            <div className="fixed top-0 left-0 right-0 bg-white z-10 flex flex-col items-center pt-16 pb-6 px-4">
              <img src={NeurobicaLogoFull} alt="Neurobica" className="h-10" />
              <p className="text-center text-gray-600 mt-6">
                Your emotionally adaptive AI companion that responds to your
                biometric data in real-time.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-40 px-4">
              {INITIAL_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="flex flex-col border rounded-xl p-4 text-left hover:shadow-md"
                  onClick={() => handleSend(s.text)}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-blue-100 rounded-full p-2">
                      <s.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">{s.text}</h3>
                  </div>
                  <p className="text-sm text-gray-600 pl-10">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isNewChat && (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* ─── Input Area (pinned) ────────────────────────── */}
      <div className="border-t p-2 bg-white">
        <ChatInput onSendMessage={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}

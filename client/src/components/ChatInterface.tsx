import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "./ui/button";
import {
  Search,
  Wand2,
  Calendar,
  Brain,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useCallback, useEffect } from "react";
import NeurobicaLogoFull from "@assets/Neurobica logo full.png";

interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  // Using key with conversation ID to force a complete re-render when switching conversations
  console.log("🔄 ChatInterface Component Rendering");

  const {
    messages,
    setMessages, // Explicitly get setMessages from useChat
    sendMessage,
    isLoading,
    isLoadingMessages,
    startNewConversation,
    activeConversation,
    activeConversationId,
    refetchMessages,
  } = useChat();

  // Listen for our custom conversation selection event
  useEffect(() => {
    const handleConversationSelected = (
      event: CustomEvent<{ id: string; messages: any[] }>,
    ) => {
      console.log(
        "📣 Received conversation-selected event for ID:",
        event.detail.id,
      );
      console.log("📣 Received conversation messages:", event.detail.messages);

      if (event.detail.messages && event.detail.messages.length > 0) {
        // Format messages properly for our component
        const formattedMessages = event.detail.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime(),
          emotionalContext: msg.emotionalContext || null,
          memoryTrigger: msg.memoryTrigger || null,
          conversationId: msg.conversationId,
        }));

        // Directly set messages from the event
        console.log(
          "📣 Setting messages directly from event:",
          formattedMessages.length,
        );
        setMessages([...formattedMessages]); // Make a new array to force re-render
      } else {
        // Force a refresh of messages via refetchMessages if available
        if (refetchMessages) {
          console.log(
            "📣 No messages in event, forcing refresh for conversation:",
            event.detail.id,
          );
          refetchMessages();
        }
      }
    };

    // Need to cast the event handler to any to work around TypeScript's strict event typing
    window.addEventListener(
      "conversation-selected",
      handleConversationSelected as any,
    );

    return () => {
      window.removeEventListener(
        "conversation-selected",
        handleConversationSelected as any,
      );
    };
  }, [refetchMessages, setMessages]);

  // Listen for the localStorage flag we set in the new chat handler
  useEffect(() => {
    const checkForClearMessages = () => {
      const shouldClear = window.localStorage.getItem("tempClearMessages");

      if (shouldClear === "true") {
        console.log(
          "📣 Detected tempClearMessages flag, refreshing chat interface",
        );
        // Clear the flag
        window.localStorage.removeItem("tempClearMessages");

        // Force new chat
        startNewConversation();
      }
    };

    // Check on mount and whenever the component re-renders
    checkForClearMessages();

    // Also set an interval to check periodically (helps with race conditions)
    const interval = setInterval(checkForClearMessages, 500);

    return () => {
      clearInterval(interval);
    };
  }, [startNewConversation]);

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage],
  );

  const convoSuggestions = [
    {
      icon: Calendar,
      text: "Help me plan my day",
      description:
        "I can help you organize your schedule and prioritize tasks.",
    },
    {
      icon: Brain,
      text: "Track my biometric data",
      description:
        "Let's monitor your stress levels and cognitive performance.",
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
      description:
        "I can find scientific studies about emotional intelligence.",
    },
  ];

  const regularSuggestions = [
    { icon: Search, text: "Search the web" },
    { icon: Wand2, text: "Generate creative ideas" },
  ];

  // Debug logging
  useEffect(() => {
    console.log("💬 ChatInterface - Current conversation state:", {
      conversation: activeConversation,
      id: activeConversationId,
      messageCount: messages.length,
    });

    if (messages.length > 0) {
      console.log("💬 First message:", messages[0]);
      console.log("💬 Last message:", messages[messages.length - 1]);
    } else {
      console.log("💬 No messages available");
    }
  }, [activeConversation, activeConversationId, messages]);

  // Determine what to show based on messages, loading state, and active conversation
  const showWelcome =
    !activeConversation && messages.length === 0 && !isLoadingMessages;
  const showTemplates =
    !activeConversation && messages.length === 0 && !isLoadingMessages;
  const showMessages = messages.length > 0 || activeConversation !== null;
  const showLoading = isLoadingMessages;

  // Use activeConversationId as a key to force re-rendering when it changes
  return (
    <div
      key={activeConversationId || "new-chat"}
      className="flex flex-col h-full w-full relative pt-14 overflow-y-auto"
    >
      {/* Debug info */}
      <div className="hidden">
        Active conversation: {activeConversationId || "none"}, Messages:{" "}
        {messages.length}, IsLoading: {isLoading ? "true" : "false"}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {showLoading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="space-y-4 w-4/5 max-w-2xl">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {showWelcome && (
          <div className="flex-1 flex flex-col items-center pt-16 mt-4 max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src={NeurobicaLogoFull}
                alt="Neurobica"
                className="h-10 ml-2"
              />
            </div>
            <p className="text-gray-600 mb-10 text-center">
              Your emotionally adaptive AI companion that responds to your
              biometric data in real-time.
            </p>

            {showTemplates && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Start a conversation about:
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  {convoSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md hover:border-blue-300"
                      onClick={() => handleSendMessage(suggestion.text)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 rounded-full p-2">
                          <suggestion.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-medium">{suggestion.text}</h3>
                      </div>
                      <p className="text-sm text-gray-600 pl-10">
                        {suggestion.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showMessages && (
          <div className="flex-1 overflow-hidden">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
        )}
      </div>
      <div className="w-full bg-white">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

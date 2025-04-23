import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "./ui/button";
import { Search, Wand2, Calendar, Brain, Clock, Heart, Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useEffect } from "react";

interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    isLoadingMessages, 
    startNewConversation,
    activeConversation 
  } = useChat();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const convoSuggestions = [
    { 
      icon: Calendar, 
      text: "Help me plan my day", 
      description: "I can help you organize your schedule and prioritize tasks."
    },
    { 
      icon: Brain, 
      text: "Track my biometric data", 
      description: "Let's monitor your stress levels and cognitive performance."
    },
    { 
      icon: Heart, 
      text: "Recommend mindfulness exercises", 
      description: "I can suggest activities based on your emotional state."
    },
    { 
      icon: Clock, 
      text: "Schedule reminders", 
      description: "I'll help you set up and manage important reminders."
    },
    { 
      icon: Sparkles, 
      text: "Analyze my mood patterns", 
      description: "Let me help identify trends in your emotional data."
    },
    { 
      icon: Search, 
      text: "Search for emotion research", 
      description: "I can find scientific studies about emotional intelligence."
    },
  ];

  const regularSuggestions = [
    { icon: Search, text: "Search the web" },
    { icon: Wand2, text: "Generate creative ideas" },
  ];

  // Determine what to show based on messages, loading state, and active conversation
  const showWelcome = !activeConversation && messages.length === 0 && !isLoadingMessages;
  const showTemplates = !activeConversation && messages.length === 0 && !isLoadingMessages;
  const showMessages = messages.length > 0 || (activeConversation !== null);
  const showLoading = isLoadingMessages;

  return (
    <div className="flex flex-col h-full w-full relative pt-14">
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text">Welcome to Neurobica</h1>
            <p className="text-gray-600 mb-10 text-center">
              Your emotionally adaptive AI companion that responds to your biometric data in real-time.
            </p>
            
            {showTemplates && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Start a conversation about:</h2>
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
                      <p className="text-sm text-gray-600 pl-10">{suggestion.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {showMessages && (
          <div className="flex-1 overflow-y-auto">
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

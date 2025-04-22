import { BiometricSourceCard } from "./biometrics/BiometricSourceCard";
import { EmotionStateCard } from "./biometrics/EmotionStateCard";
import { useState } from "react";
import { useBiometrics } from "@/context/BiometricsContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Calendar,
  List,
  Settings,
  Cog,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  date: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { biometricSources, emotionalStates } = useBiometrics();
  const [minimized, setMinimized] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    // Fetch conversations on mount
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => setConversations(data))
      .catch(console.error);
  }, []);

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Chat' })
      });
      
      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        // You can add navigation to the new chat here if needed
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  // Just showing the icon for navigation links when minimized
  const renderNavLink = (
    href: string,
    icon: React.ReactNode,
    label: string,
  ) => {
    const isActive = location === href;
    const baseClasses =
      "flex items-center px-3 py-2 text-sm rounded-md transition-colors";
    const activeClasses = "bg-primary text-white";
    const inactiveClasses = "text-neutral-dark hover:bg-neutral-light";

    return (
      <Link href={href}>
        <div
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} cursor-pointer`}
        >
          <span className="mr-3">{icon}</span>
          {!minimized && <span>{label}</span>}
        </div>
      </Link>
    );
  };

  return (
    <aside
      className={`
        relative flex flex-col
        ${isOpen ? "fixed z-50 top-16 left-0 h-[calc(100vh-4rem)]" : "hidden"} 
        ${minimized ? "w-16" : "w-64"} 
        md:flex md:static md:z-auto md:h-full
        bg-white border-r border-gray-200 transition-all duration-300
      `}
    >
      {isOpen && (
        <div className="md:hidden absolute top-3 right-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-none p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          {!minimized && (
            <Button variant="outline" size="sm" className="mr-2" onClick={handleNewChat}>
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>New Chat</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMinimize}
            className="md:flex hidden rounded-full"
          >
            {minimized ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Conversations section */}
      {!minimized && (
        <div className="flex-grow overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className="w-full justify-start font-normal py-2 px-3 h-auto text-left"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-sm truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {conversation.date}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

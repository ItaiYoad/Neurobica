import { BiometricSourceCard } from "./biometrics/BiometricSourceCard";
import { EmotionStateCard } from "./biometrics/EmotionStateCard";
import { useState, useEffect } from "react";
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
  timestamp: number;
  emotionalStates?: {
    type: string;
    level: number;
    label: string;
    color: string;
  }[];
  isHighlighted?: boolean;
  folder?: string;
}

interface ConversationType {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
}

const conversationTypes: ConversationType[] = [
  {
    id: 'general',
    title: 'General Chat',
    description: 'Open-ended conversation',
    initialPrompt: ''
  },
  {
    id: 'focus',
    title: 'Focus Session',
    description: 'Stay productive and track progress',
    initialPrompt: "Let's have a focused session. What would you like to accomplish?"
  },
  {
    id: 'reflection',
    title: 'Daily Reflection',
    description: 'Review and process your day',
    initialPrompt: "I'm here to help you reflect. How was your day?"
  }
];

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

  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  
  const handleSelectChat = (id: string) => {
    setSelectedChat(id);
    // Trigger chat loading in parent component
    onSelectChat?.(id);
  };

  const handleNewChat = (type: ConversationType) => {
    handleCreateChat(type.initialPrompt);
    setShowNewChatDialog(false);
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setConversations(prev => prev.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
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
              <div
                key={conversation.id}
                className={`group relative ${
                  selectedChat === conversation.id ? 'bg-primary/10' : ''
                } ${conversation.isHighlighted ? 'border-l-2 border-primary' : ''}`}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal py-2 px-3 h-auto text-left"
                  onClick={() => handleSelectChat(conversation.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="truncate flex-1">
                    <div className="text-sm truncate">{conversation.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conversation.timestamp).toLocaleDateString()}
                    </div>
                    {conversation.emotionalStates && (
                      <div className="flex gap-1 mt-1">
                        {conversation.emotionalStates.map((state, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full bg-status-${state.color}`}
                            title={`${state.label} (${state.type})`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Button>
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleRenameChat(conversation.id, "")}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteChat(conversation.id)}>
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}>
                        Highlight
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Move to folder</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {folders.map(folder => (
                            <DropdownMenuItem key={folder}>
                              {folder}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New folder
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
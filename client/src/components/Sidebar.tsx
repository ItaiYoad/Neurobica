import { BiometricSourceCard } from "./biometrics/BiometricSourceCard";
import { EmotionStateCard } from "./biometrics/EmotionStateCard";
import { useState } from "react";
import { useBiometrics } from "@/context/BiometricsContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronLeft, ChevronRight, MessageSquare, BarChart3, Calendar, List, Settings, Cog } from "lucide-react";

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
  const [conversations, setConversations] = useState<ConversationItem[]>([
    { id: '1', title: 'Morning Planning Session', date: 'Today' },
    { id: '2', title: 'Workout Goals', date: 'Yesterday' },
    { id: '3', title: 'Meeting Preparation', date: '3 days ago' },
  ]);

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  // Just showing the icon for navigation links when minimized
  const renderNavLink = (href: string, icon: React.ReactNode, label: string) => {
    const isActive = location === href;
    const baseClasses = "flex items-center px-3 py-2 text-sm rounded-md transition-colors";
    const activeClasses = "bg-primary text-white";
    const inactiveClasses = "text-neutral-dark hover:bg-neutral-light";

    return (
      <Link href={href}>
        <div className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} cursor-pointer`}>
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
        ${isOpen ? 'fixed z-50 top-0 left-0 h-full' : 'hidden'} 
        ${minimized ? 'w-16' : 'w-64'} 
        md:flex md:static md:z-auto 
        bg-white border-r border-gray-200 transition-all duration-300
      `}
    >
      {isOpen && (
        <div className="md:hidden absolute top-3 right-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex-none p-4 border-b border-gray-200 flex items-center justify-between">
        {!minimized && <div className="text-sm font-semibold text-primary">Conversations</div>}
        <div className="flex items-center">
          {!minimized && (
            <Button variant="outline" size="sm" className="mr-2">
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
            {minimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Conversations section */}
      {!minimized && (
        <div className="flex-grow overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.map(conversation => (
              <Button 
                key={conversation.id}
                variant="ghost" 
                className="w-full justify-start font-normal py-2 px-3 h-auto text-left"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-sm truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">{conversation.date}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Current State section - only show when not minimized */}
      {!minimized && biometricSources.length > 0 && (
        <div className="flex-none p-4 border-t border-gray-200">
          <div className="text-xs font-medium text-neutral-mid uppercase mb-2">Biometric State</div>
          <div className="space-y-2">
            {emotionalStates.map(state => (
              <EmotionStateCard key={state.type} state={state} />
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation section */}
      <div className="flex-none p-2 border-t border-gray-200">
        <nav className="space-y-1">
          {renderNavLink("/", <MessageSquare className="h-4 w-4" />, "Chat")}
          {renderNavLink("/dashboard", <BarChart3 className="h-4 w-4" />, "Dashboard")}
          {renderNavLink("/scheduler", <Calendar className="h-4 w-4" />, "Scheduler")}
          {renderNavLink("/logs", <List className="h-4 w-4" />, "Logs")}
          {renderNavLink("/configuration", <Cog className="h-4 w-4" />, "Configuration")}
          {renderNavLink("/settings", <Settings className="h-4 w-4" />, "Settings")}
        </nav>
      </div>
    </aside>
  );
}

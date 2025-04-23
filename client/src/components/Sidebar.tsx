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
  const [conversations, setConversations] = useState<ConversationItem[]>([
    { id: "1", title: "Morning Planning Session", date: "Today" },
    { id: "2", title: "Workout Goals", date: "Yesterday" },
    { id: "3", title: "Meeting Preparation", date: "3 days ago" },
  ]);

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

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
        fixed z-50 top-16 flex flex-col h-[calc(100vh-4rem)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${minimized ? "w-16" : "w-64"}
        md:transform-none md:flex md:static md:z-auto md:h-full
        bg-white border-r border-gray-200
      `}
    >
      <div className="flex-none p-4 border-b border-gray-200 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-full">
          <PlusCircle className="h-4 w-4" />
        </Button>
        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMinimize}
          className="hidden md:flex rounded-full"
        >
          {minimized ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

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
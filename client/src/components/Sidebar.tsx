import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, Search, PlusCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  icon?: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [conversations] = useState<ConversationItem[]>([
    { id: "1", title: "ChatGPT", icon: "🤖" },
    { id: "2", title: "Sora", icon: "🌌" },
    { id: "3", title: "Socratest", icon: "🧠" },
    { id: "4", title: "ThemAI", icon: "🎨" },
    { id: "5", title: "Productor GPT", icon: "⚡" },
    { id: "6", title: "BrainStormerIL", icon: "💡" },
    { id: "7", title: "QuotAI", icon: "📝" },
    { id: "8", title: "Neuroscience", icon: "🧪" },
    { id: "9", title: "Neurotester", icon: "🔬" },
  ]);

  if (!isOpen) {
    return (
      <div className="fixed top-16 left-0 p-2 flex flex-col gap-2 border-r border-gray-200 bg-white">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {/* New chat logic */}}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="fixed z-50 top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 flex flex-col md:static md:z-auto">
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {/* Search logic */}}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {/* New chat logic */}}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className="w-full justify-start font-normal h-auto text-left"
            >
              <span className="mr-2">{conversation.icon}</span>
              <span className="truncate">{conversation.title}</span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
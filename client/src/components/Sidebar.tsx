import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  PanelLeft,
  PlusCircle,
  PanelRightClose,
  Menu,
  RotateCcw
} from "lucide-react";

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
  const [conversations] = useState<ConversationItem[]>([
    { id: "1", title: "ChatGPT", icon: "🤖" },
    { id: "2", title: "Sora", icon: "🎥" },
    { id: "3", title: "Socratest", icon: "🧠" },
    { id: "4", title: "ThemAI", icon: "🎨" },
    { id: "5", title: "Productor GPT", icon: "📊" },
    { id: "6", title: "BrainStormerIL", icon: "💡" },
    { id: "7", title: "QuotAI", icon: "💬" },
    { id: "8", title: "Neuroscience", icon: "🧪" },
    { id: "9", title: "Neurotester", icon: "🔬" },
  ]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.style.transition = 'transform 0.3s ease-in-out';
      sidebarRef.current.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';
    }
  }, [isOpen]);


  return (
    <>
      <div
        ref={sidebarRef}
        className={`fixed top-16 left-0 h-screen p-2 flex flex-col gap-2 border-r bg-white z-50 ${isOpen ? '' : 'transform -translate-x-full'}`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <PanelRightClose className="h-4 w-4 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}/>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        {isOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-3">
                  <span className="text-lg">{conversation.icon}</span>
                  <span className="text-sm truncate">{conversation.title}</span>
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
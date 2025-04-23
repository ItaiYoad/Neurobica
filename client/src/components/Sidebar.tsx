import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, PlusCircle, Search } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [conversations] = useState([]);

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        z-50
      `}
    >
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 ml-auto"
        >
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-56px)]">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="p-2">
            {/* Conversation items will go here */}
          </div>
        ))}
      </div>
    </aside>
  );
}
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, Search } from "lucide-react";
import { ConversationList } from "./sidebar/ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-[290px] bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        z-50
      `}
    >
      <div className="flex items-center gap-2 h-14 px-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="ml-2 font-semibold text-lg">
          Neurobica
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 ml-auto"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      <div className="h-[calc(100vh-56px)]">
        <ConversationList />
      </div>
    </aside>
  );
}
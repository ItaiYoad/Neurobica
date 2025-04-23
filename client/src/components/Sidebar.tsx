
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, Search } from "lucide-react";
import { ConversationList } from "./sidebar/ConversationList";
import { useCallback, useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen: propIsOpen, onClose }: SidebarProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(propIsOpen);

  useEffect(() => {
    setIsOpen(propIsOpen);
  }, [propIsOpen]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;
    const isLeftSwipe = distance < -minSwipeDistance;
    
    if (!isOpen && isRightSwipe) {
      setIsOpen(true);
      onClose(); // This actually opens the sidebar in the parent component
    } else if (isOpen && isLeftSwipe) {
      setIsOpen(false);
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      document.addEventListener('touchstart', onTouchStart);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);

      return () => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [onTouchEnd, isOpen]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
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

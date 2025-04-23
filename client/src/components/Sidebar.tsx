// Sidebar.tsx
"use client";

import { useSwipeable } from "react-swipeable";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { ConversationList } from "./sidebar/ConversationList";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 290;

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: ({ event }) => {
      // Prevent this swipe closing from bubbling to Home
      event.stopPropagation();
      onClose();
    },
    trackTouch: true,
    delta: 50,
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            {...swipeHandlers} // attach here
            initial={{ x: -DRAWER_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -DRAWER_WIDTH }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="fixed top-0 left-0 h-screen w-[290px] bg-white border-r border-gray-200 z-50"
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
              <Button variant="ghost" size="icon" className="h-9 w-9 ml-auto">
                <Search className="h-5 w-5" />
              </Button>
            </div>
            <div className="h-[calc(100vh-56px)]">
              <ConversationList />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

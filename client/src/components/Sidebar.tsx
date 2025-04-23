import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { ConversationList } from "./sidebar/ConversationList";
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 290;

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const bind = useDrag(({ swipe: [swipeX], movement: [mx], direction: [dx], cancel, last }) => {
    if (swipeX === 1) onClose(); // Swipe Right to open (counterintuitive but matches the parent state)
    if (swipeX === -1) onClose(); // Swipe Left to close

    if (last) {
      if (dx > 0.5) onClose(); // Open
      else if (dx < -0.5) onClose(); // Close
    }

    if (Math.abs(mx) > DRAWER_WIDTH) cancel();
  }, {
    axis: 'x',
    threshold: 15,
    swipe: { 
      distance: [50, 50] 
    },
  });

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div {...bind()} className="touch-pan-x">
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              initial={{ x: -DRAWER_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -DRAWER_WIDTH }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
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
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
// Home.tsx
"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { SidePanel } from "@/components/SidePanel";

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidePanelOpen, setSidePanelOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidePanelOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSidePanel = (open: boolean) => {
    if (open) setSidebarOpen(false);
    setSidePanelOpen(open);
  };

  const handlers = useSwipeable({
    onSwipedRight: () => {
      if (isSidebarOpen) setSidebarOpen(false);
      else if (!isSidePanelOpen) setSidebarOpen(true);
    },
    onSwipedLeft: () => {
      if (isSidePanelOpen) setSidePanelOpen(false);
      else if (!isSidebarOpen) setSidePanelOpen(true);
    },
    trackTouch: true,
    delta: 50,
    enabled: isMobile,
  });

  return (
    <div
      {...handlers}
      className="flex flex-col h-screen bg-neutral-lighter text-neutral-dark"
    >
      <div
        className={`transition-all duration-300 ${isSidebarOpen ? "ml-[260px]" : ""}`}
      >
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col h-full">
            <ChatInterface />
          </div>
          {/* Side panel */}
          <SidePanel isOpen={isSidePanelOpen} onOpenChange={handleSidePanel} />
        </div>
      </div>
    </div>
  );
}

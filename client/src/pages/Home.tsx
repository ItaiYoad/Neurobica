import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { SidePanel } from "@/components/SidePanel";
import { useState } from "react";

export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const toggleMobileSidebar = () => {
    if (!mobileSidebarOpen) {
      setSidePanelOpen(false);
    }
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const toggleSidePanel = (isOpen: boolean) => {
    if (isOpen) {
      setMobileSidebarOpen(false);
    }
    setSidePanelOpen(isOpen);
  };

  return (
    <div className="font-sans bg-neutral-lighter text-neutral-dark h-screen flex flex-col">
      <div className={`transition-all duration-300 ${mobileSidebarOpen ? 'ml-[260px]' : ''}`}>
        <Header toggleSidebar={toggleMobileSidebar} isSidebarOpen={mobileSidebarOpen} />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <ChatInterface />
          </div>
          <SidePanel isOpen={sidePanelOpen} onOpenChange={toggleSidePanel} />
        </main>
      </div>
    </div>
  );
}
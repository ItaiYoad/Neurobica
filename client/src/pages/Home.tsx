import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { SidePanel } from "@/components/SidePanel";
import { useState } from "react";

export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="font-sans bg-neutral-lighter text-neutral-dark h-screen flex flex-col pt-14">
      <Header toggleSidebar={toggleMobileSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className={`flex-1 flex overflow-hidden transition-all duration-300 ${mobileSidebarOpen ? 'ml-[260px]' : ''}`}>
          <ChatInterface />
          <div className={`transition-all duration-300 ${mobileSidebarOpen ? 'w-56' : 'w-80'}`}>
            <SidePanel />
          </div>
        </main>
      </div>
    </div>
  );
}
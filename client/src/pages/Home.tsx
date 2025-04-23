import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";

import { useState } from "react";

export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="font-sans bg-neutral-lighter text-neutral-dark h-screen flex flex-col">
      <Header toggleSidebar={toggleMobileSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {!mobileSidebarOpen && (
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 flex overflow-hidden">
          <ChatInterface toggleSidebar={toggleMobileSidebar} />
        </main>
      </div>
    </div>
  );
}
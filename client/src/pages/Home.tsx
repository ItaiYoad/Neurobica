import { useState } from "react";
import { Menu } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { BiometricChart } from "@/components/biometrics/BiometricChart";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="font-sans bg-neutral-lighter text-neutral-dark h-screen flex flex-col">
      <Header toggleSidebar={toggleSidebar} showMenuButton={true} emotionalState={emotionalState} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={`flex-1 flex overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-[260px]' : 'ml-0'}`}>
          <ChatInterface toggleSidebar={toggleSidebar} />
        </main>
      </div>
    </div>
  );
}
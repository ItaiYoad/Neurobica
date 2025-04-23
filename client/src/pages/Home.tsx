import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { SidePanel } from "@/components/SidePanel";
import { useState, useEffect } from "react";

export default function Home() {
  let touchStartX = 0;
  let touchEndX = 0;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > 50) { // Min swipe distance
        if (swipeDistance > 0) { // Right swipe
          setMobileSidebarOpen(true);
        } else { // Left swipe
          setMobileSidebarOpen(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="font-sans bg-neutral-lighter text-neutral-dark h-screen flex flex-col">
      <Header toggleSidebar={toggleMobileSidebar} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 flex overflow-hidden">
          <ChatInterface toggleSidebar={toggleMobileSidebar} />
          <SidePanel />
        </main>
      </div>
    </div>
  );
}
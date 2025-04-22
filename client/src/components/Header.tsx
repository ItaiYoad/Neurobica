import { useState } from "react";
import NeurobicaLogoFull from "@assets/Neurobica logo full.png";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [isConnected, setIsConnected] = useState(true);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <img src={NeurobicaLogoFull} alt="Neurobica" className="h-8" />
        </div>
        <span className="text-xs bg-[#A78BFA] text-white px-2 py-0.5 rounded-full">
          POC
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <span className="text-[#9CA3AF]">Status:</span>
          <span
            className={`font-semibold ${isConnected ? "text-[#10B981]" : "text-[#EF4444]"}`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="relative">
          <button className="flex items-center space-x-1 bg-[#F3F4F6] hover:bg-neutral-200 px-3 py-1.5 rounded-md transition">
            <span>Admin</span>
            <i className="fas fa-chevron-down text-xs"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

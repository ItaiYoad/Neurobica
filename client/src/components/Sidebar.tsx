import { BiometricSourceCard } from "./biometrics/BiometricSourceCard";
import { EmotionStateCard } from "./biometrics/EmotionStateCard";
import { useState } from "react";
import { useBiometrics } from "@/context/BiometricsContext";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { biometricSources, emotionalStates } = useBiometrics();

  return (
    <aside 
      className={`${isOpen ? 'fixed z-50 top-0 left-0 h-full w-64' : 'hidden'} md:flex md:static md:z-auto md:flex-col w-64 bg-white border-r border-gray-200 overflow-y-auto`}
    >
      {isOpen && (
        <div className="md:hidden absolute top-3 right-3">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-light text-neutral-mid">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-semibold text-neutral-mid uppercase">Biometric Sources</div>
        <div className="mt-2 space-y-2">
          {biometricSources.map(source => (
            <BiometricSourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-semibold text-neutral-mid uppercase">Current State</div>
        <div className="mt-3 space-y-4">
          {emotionalStates.map(state => (
            <EmotionStateCard key={state.type} state={state} />
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-sm font-semibold text-neutral-mid uppercase mb-3">System</div>
        <nav className="space-y-1">
          <Link href="/">
            <a className={`flex items-center px-3 py-2 text-sm rounded-md ${location === "/" ? "bg-[#60A5FA] text-white" : "text-neutral-dark hover:bg-neutral-light"}`}>
              <i className="fas fa-comment-dots mr-3"></i>
              <span>Chat Interface</span>
            </a>
          </Link>
          <Link href="/dashboard">
            <a className={`flex items-center px-3 py-2 text-sm rounded-md ${location === "/dashboard" ? "bg-[#60A5FA] text-white" : "text-neutral-dark hover:bg-neutral-light"}`}>
              <i className="fas fa-chart-line mr-3"></i>
              <span>Biometric Dashboard</span>
            </a>
          </Link>
          <Link href="/scheduler">
            <a className={`flex items-center px-3 py-2 text-sm rounded-md ${location === "/scheduler" ? "bg-[#60A5FA] text-white" : "text-neutral-dark hover:bg-neutral-light"}`}>
              <i className="fas fa-calendar-alt mr-3"></i>
              <span>Life Scheduler</span>
            </a>
          </Link>
          <Link href="/logs">
            <a className={`flex items-center px-3 py-2 text-sm rounded-md ${location === "/logs" ? "bg-[#60A5FA] text-white" : "text-neutral-dark hover:bg-neutral-light"}`}>
              <i className="fas fa-list-alt mr-3"></i>
              <span>System Logs</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className={`flex items-center px-3 py-2 text-sm rounded-md ${location === "/settings" ? "bg-[#60A5FA] text-white" : "text-neutral-dark hover:bg-neutral-light"}`}>
              <i className="fas fa-cog mr-3"></i>
              <span>Settings</span>
            </a>
          </Link>
        </nav>
      </div>
    </aside>
  );
}


import { useState } from "react";
import { Menu, HelpCircle, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmotionalState } from "@/types";

interface HeaderProps {
  toggleSidebar: () => void;
  showMenuButton?: boolean;
  emotionalState?: EmotionalState;
}

export function Header({ toggleSidebar, showMenuButton = true, emotionalState }: HeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
            <div className="flex items-center text-sm text-neutral-mid">
              <span className="flex items-center">
                <span className={`h-2 w-2 ${emotionalState ? `bg-status-${emotionalState.color}` : 'bg-status-calm'} rounded-full mr-1.5`}></span>
                {emotionalState ? `${emotionalState.label} mode active` : 'Emotion-aware mode active'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/configuration">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

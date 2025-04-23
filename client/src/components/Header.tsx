import NeurobicaLogoFull from "@assets/Neurobica logo full.png";
import { HelpCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SystemLogs } from "@/components/logs/SystemLogs"; // Assuming this import is correct

interface HeaderProps {
  toggleSidebar: () => void;
  showMenuButton?: boolean;
}

export function Header({ toggleSidebar, showMenuButton }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
      <div className="flex items-center gap-2">
        {showMenuButton && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-medium">Neurobica AI</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Log out</DropdownMenuItem>
            <DropdownMenuItem>
              <SystemLogs />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    import { Menu } from "@/components/ui/menubar";

</div>
  );
}

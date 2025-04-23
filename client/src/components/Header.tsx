import { useState } from "react";
import NeurobicaLogoFull from "@assets/Neurobica logo full.png";
import { Menu, User, LogOut, Settings, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBiometrics } from "@/context/BiometricsContext";
import { useNotifications } from "@/context/NotificationsContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { connected } = useBiometrics();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    handleNotificationAction
  } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        {/* Mobile sidebar toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2" 
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <img src={NeurobicaLogoFull} alt="Neurobica" className="h-8" />
        </div>
        <span className="text-xs bg-purple-400 text-white px-2 py-0.5 rounded-full">
          POC
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="text-sm hidden md:block">
          <span className="text-muted-foreground">Status:</span>
          <span
            className={`ml-1 font-medium ${connected ? "text-green-500" : "text-red-500"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Notifications */}
        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                Stay up to date with biometric and system updates
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b last:border-b-0 ${notification.read ? 'opacity-70' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">{notification.message}</p>
                    
                    {notification.options && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {notification.options.map(option => (
                          <Button 
                            key={option.action} 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleNotificationAction(notification.id, option.action)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
            </ScrollArea>
            
            <SheetFooter className="flex gap-2 p-4 border-t">
              <SheetClose asChild>
                <Button variant="outline" onClick={markAllAsRead}>Close</Button>
              </SheetClose>
              <Button 
                variant="ghost" 
                onClick={clearNotifications} 
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden md:inline-block">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

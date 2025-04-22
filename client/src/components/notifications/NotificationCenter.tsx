import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications, Notification } from "@/context/NotificationsContext";
import { Button } from "@/components/ui/button";
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
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    handleNotificationAction
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Mark all as read when closing the notification center
      markAllAsRead();
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    return (
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
        
        {notification.emotionalState && (
          <div 
            className={`mt-2 px-2 py-1 text-xs inline-flex items-center rounded-full
              ${notification.emotionalState.color === 'calm' ? 'bg-green-100 text-green-800' : 
                notification.emotionalState.color === 'moderate' ? 'bg-blue-100 text-blue-800' : 
                'bg-red-100 text-red-800'}`}
          >
            {notification.emotionalState.label} state detected
          </div>
        )}
      </div>
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
            Stay up to date with your biometric and system notifications
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-auto p-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="biometric">Biometric</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="all" className="mt-0">
              {notifications.length > 0 ? (
                notifications.map(renderNotificationContent)
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="unread" className="mt-0">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map(renderNotificationContent)
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No unread notifications
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="biometric" className="mt-0">
              {notifications.filter(n => 
                n.type === 'context_based' || 
                n.type === 'feedback_loop'
              ).length > 0 ? (
                notifications
                  .filter(n => 
                    n.type === 'context_based' || 
                    n.type === 'feedback_loop'
                  )
                  .map(renderNotificationContent)
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No biometric notifications
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <SheetFooter className="flex gap-2 p-4 border-t">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
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
  );
}
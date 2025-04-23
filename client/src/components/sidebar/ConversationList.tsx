import { useState, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { useConversations, Conversation } from "@/hooks/useConversations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Clock, 
  Edit2, 
  Loader2, 
  MessageSquare, 
  MoreVertical, 
  PlusCircle,
  Trash2,
  Heart,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function ConversationList() {
  const {
    conversations,
    isLoading,
    activeConversationId,
    setActiveConversation,
    createConversation,
    renameConversation,
    deleteConversation
  } = useConversations();
  
  const { startNewConversation } = useChat();
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState("");
  
  const handleStartNewChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Starting new conversation (from ConversationList)");
    startNewConversation();
  };
  
  const handleSelectConversation = (conversationId: string) => {
    console.log("Selecting conversation:", conversationId, "Current active:", activeConversationId);
    if (conversationId !== activeConversationId) {
      console.log("Setting active conversation to:", conversationId);
      setActiveConversation(conversationId);
    }
  };
  
  const handleRenameClick = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setNewTitle(conversation.title);
    setIsRenameDialogOpen(true);
  }, []);
  
  const handleRenameSubmit = useCallback(async () => {
    if (!selectedConversation) return;
    
    try {
      await renameConversation.mutateAsync({
        id: selectedConversation.id,
        title: newTitle
      });
      
      setIsRenameDialogOpen(false);
      toast({
        title: "Conversation renamed",
        description: "Your conversation has been renamed successfully.",
      });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast({
        title: "Error renaming conversation",
        description: "There was an error renaming your conversation. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedConversation, newTitle, renameConversation, toast]);
  
  const handleDeleteClick = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDeleteDialogOpen(true);
  }, []);
  
  const handleDeleteSubmit = useCallback(async () => {
    if (!selectedConversation) return;
    
    try {
      await deleteConversation.mutateAsync(selectedConversation.id);
      
      setIsDeleteDialogOpen(false);
      toast({
        title: "Conversation deleted",
        description: "Your conversation has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error deleting conversation",
        description: "There was an error deleting your conversation. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedConversation, deleteConversation, toast]);
  
  // Function to get emotion icon based on emotional tag
  const getEmotionIcon = (emotionalTag: string | null) => {
    if (!emotionalTag) return null;
    
    const tag = emotionalTag.toLowerCase();
    if (tag.includes("calm") || tag.includes("low")) {
      return <Heart className="h-4 w-4 text-green-500" />;
    } else if (tag.includes("moderate")) {
      return <Zap className="h-4 w-4 text-amber-500" />;
    } else if (tag.includes("stress") || tag.includes("high")) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <MessageSquare className="h-4 w-4 text-gray-500" />;
  };
  
  // Get a formatted date string
  const getFormattedDate = (date: string | null) => {
    if (!date) return "";
    
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <Button
        className="my-2 mx-4 gap-2"
        onClick={handleStartNewChat}
      >
        <PlusCircle className="h-4 w-4" />
        New Chat
      </Button>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 italic">
            No conversations yet
          </div>
        ) : (
          <div className="px-2 py-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const emotionIcon = getEmotionIcon(conversation.emotionalTag);
              
              return (
                <div
                  key={conversation.id}
                  className={`rounded-lg p-2 my-1 flex items-center group ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0">
                              {emotionIcon || <MessageSquare className="h-4 w-4 text-gray-500" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{conversation.emotionalTag || "No emotion data"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <span className="font-medium truncate">
                        {conversation.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {conversation.lastMessageAt
                          ? getFormattedDate(conversation.lastMessageAt)
                          : "No messages"}
                      </span>
                      
                      {conversation.messageCount > 0 && (
                        <span className="ml-2">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {conversation.messageCount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(conversation);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(conversation);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameSubmit}
              disabled={!newTitle.trim() || renameConversation.isPending}
            >
              {renameConversation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteConversation.isPending}
            >
              {deleteConversation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
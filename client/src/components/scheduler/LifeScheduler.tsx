import { useState } from "react";
import { MemoryItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LifeSchedulerProps {
  memoryItems: MemoryItem[];
  onAddMemoryItem: (item: Omit<MemoryItem, "id" | "createdAt">) => void;
}

export function LifeScheduler({ memoryItems, onAddMemoryItem }: LifeSchedulerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "reminder" as const,
    content: "",
    time: "",
    category: "Personal"
  });

  const handleAddItem = () => {
    onAddMemoryItem({
      type: newItem.type,
      content: newItem.content,
      time: newItem.time,
      category: newItem.category
    });
    
    setNewItem({
      type: "reminder",
      content: "",
      time: "",
      category: "Personal"
    });
    
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h2 className="font-semibold">Life Scheduler</h2>
      <div className="mt-3 space-y-3">
        {memoryItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">
                {item.type === "reminder" ? "Daily Reminder" : 
                 item.type === "location" ? "Location Memory" : 
                 item.type === "preference" ? "Preference" : "Task"}
              </div>
              <span className="text-xs text-neutral-mid">
                {item.time || item.category || ""}
              </span>
            </div>
            <p className="text-sm text-neutral-dark">{item.content}</p>
            <div className="flex justify-end mt-2">
              <button className="text-xs text-primary hover:text-primary-dark">Edit</button>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="w-full mt-3 py-2 border border-dashed border-gray-300 rounded-lg text-neutral-mid text-sm hover:bg-neutral-light"
        onClick={() => setIsDialogOpen(true)}
      >
        <i className="fas fa-plus mr-1"></i> Add New Item
      </button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Memory Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={newItem.type} 
                onValueChange={(value: any) => setNewItem({...newItem, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Input 
                id="content" 
                value={newItem.content} 
                onChange={(e) => setNewItem({...newItem, content: e.target.value})} 
                placeholder="Enter content"
              />
            </div>
            
            {newItem.type === "reminder" && (
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time" 
                  value={newItem.time} 
                  onChange={(e) => setNewItem({...newItem, time: e.target.value})} 
                  placeholder="e.g. 8:00 AM"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newItem.category} 
                onValueChange={(value) => setNewItem({...newItem, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddItem}
              disabled={!newItem.content}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

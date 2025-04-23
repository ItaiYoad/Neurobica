import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLifeScheduler } from "@/hooks/useLifeScheduler";

export function LifeScheduler() {
  const { tasks = [], addTask } = useLifeScheduler();
  const [newTask, setNewTask] = useState("");

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3 className="font-semibold">Life Scheduler</h3>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    // User message
    return (
      <div className="mb-4 flex justify-end">
        <div className="bg-primary text-white rounded-lg p-3 shadow-sm max-w-3xl">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  } else {
    // AI message
    return (
      <div className="mb-4">
        <div className="flex mb-2">
          <div className="mr-2 flex-shrink-0">
            <img 
              src="/attached_assets/Chat assistant logo.png" 
              alt="Assistant" 
              className="w-8 h-8 rounded-full"
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 shadow-sm max-w-3xl">
            <div className="text-sm space-y-2">
              <p>{message.content}</p>
              
              {message.emotionalContext && (
                <div className="flex items-center text-[11px] text-neutral-mid mt-2">
                  <i className="fas fa-heart-rate mr-1"></i>
                  <span>
                    {message.emotionalContext.includes("calm") ? (
                      <>
                        I'm currently detecting that you're in a <span className="text-blue-400">calm</span> state.
                      </>
                    ) : (
                      message.emotionalContext
                    )}
                  </span>
                </div>
              )}
              
              {message.memoryTrigger && (
                <div className={`p-2 ${
                  message.memoryTrigger.type === 'reminder' 
                    ? 'bg-secondary-light bg-opacity-10 border border-secondary-light' 
                    : 'bg-accent-light bg-opacity-10 border border-accent-light'
                } rounded-md mt-2`}>
                  <div className="flex items-center">
                    <i className={`${
                      message.memoryTrigger.type === 'reminder' 
                        ? 'fas fa-calendar-check text-secondary' 
                        : 'fas fa-brain text-accent'
                    } mr-2`}></i>
                    <div className="text-sm">
                      <span className="font-medium">
                        {message.memoryTrigger.type === 'reminder' 
                          ? 'Added to Life Scheduler:' 
                          : 'Added to memory:'}
                      </span>
                      <span className="ml-1 text-neutral-dark">{message.memoryTrigger.content}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

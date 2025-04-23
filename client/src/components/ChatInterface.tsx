import { useState } from "react";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { Button } from "./ui/button";
import { Search, Wand2 } from "lucide-react";
import { useBiometrics } from "@/context/BiometricsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { BiometricChart } from "./biometrics/BiometricChart";
import NeurobicaLogo from "@assets/Neurobica logo full.png";
interface ChatInterfaceProps {
  toggleSidebar: () => void;
}

export function ChatInterface({ toggleSidebar }: ChatInterfaceProps) {
  const { messages, sendMessage, isLoading } = useChat();
  const [showBiometrics, setShowBiometrics] = useState(false);
  const { biometricData } = useBiometrics();

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const suggestions = [
    { icon: Search, text: "Search the web" },
    { icon: Wand2, text: "Generate creative ideas" },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      <div
        className={`absolute ${messages.length > 0 ? "bottom-32" : "bottom-4"} left-4 bg-white/60 p-2 rounded-lg shadow-sm cursor-pointer hover:bg-white/80 transition-all duration-300`}
        onClick={() => setShowBiometrics(true)}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="p-1 border rounded-lg">
            <div className="text-xs text-gray-500">Heart Rate</div>
            <div className="text-lg font-semibold text-red-500">
              {biometricData.heartRate} bpm
            </div>
          </div>
          <div className="p-1 border rounded-lg">
            <div className="text-xs text-gray-500">EEG Alpha</div>
            <div className="text-lg font-semibold text-green-500">
              {biometricData.eegAlpha.toFixed(1)} μV
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showBiometrics} onOpenChange={setShowBiometrics}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biometric Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <BiometricChart data={biometricData} className="w-full h-64" />
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Heart Rate</div>
                <div className="text-2xl font-semibold">
                  {biometricData.heartRate} bpm
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">EEG Alpha</div>
                <div className="text-2xl font-semibold">
                  {biometricData.eegAlpha.toFixed(1)} μV
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <img
        src={NeurobicaLogo}
        alt="Neurobica"
        className="fixed right-4 bottom-4 h-5 opacity-30 z-10 pointer-events-none"
      />
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold mb-8">What can I help with?</h1>
          <div className="flex flex-wrap justify-center gap-4 max-w-xl">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-12 px-6 flex items-center gap-2"
                onClick={() => handleSendMessage(suggestion.text)}
              >
                <suggestion.icon className="h-5 w-5" />
                {suggestion.text}
              </Button>
            ))}
          </div>
          <div className="w-full max-w-3xl mt-8">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden flex justify-center">
            <div className="w-full max-w-3xl px-4">
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-full max-w-3xl px-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}


import { ScrollArea } from "./ui/scroll-area";
import { BiometricChart } from "./biometrics/BiometricChart";
import { LifeScheduler } from "./scheduler/LifeScheduler";
import { useBiometrics } from "@/context/BiometricsContext";
import { useLifeScheduler } from "@/hooks/useLifeScheduler";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "./ui/sheet";
import { useState, useEffect, useCallback } from "react";

export function SidePanel() {
  const { biometricData } = useBiometrics();
  const { memoryItems, addMemoryItem } = useLifeScheduler();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches[0].clientX > window.innerWidth - 30) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStart) {
      setTouchEnd(e.touches[0].clientX);
    }
  };

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && !isOpen) {
      setIsOpen(true);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, isOpen]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchstart', onTouchStart);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);

      return () => {
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [isMobile, onTouchEnd]);

  const content = (
    <ScrollArea className="h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold">Biometric Data</h2>
        <div className="mt-3">
          <BiometricChart data={biometricData} />

          <div className="mt-3 flex space-x-2">
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-center">
              <div className="text-xs text-neutral-mid">Heart Rate</div>
              <div className="text-xl font-semibold text-[#F59E0B]">
                {biometricData.heartRate} <span className="text-xs">bpm</span>
              </div>
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-center">
              <div className="text-xs text-neutral-mid">EEG Alpha</div>
              <div className="text-xl font-semibold text-[#10B981]">
                {biometricData.eegAlpha.toFixed(1)} <span className="text-xs">μV</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LifeScheduler memoryItems={memoryItems} onAddMemoryItem={addMemoryItem} />
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-[400px] p-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-full border-l border-gray-200 bg-white h-full">
      {content}
    </div>
  );
}

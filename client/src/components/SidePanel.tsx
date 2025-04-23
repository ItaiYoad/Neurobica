
import { ScrollArea } from "./ui/scroll-area";
import { BiometricChart } from "./biometrics/BiometricChart";
import { LifeScheduler } from "./scheduler/LifeScheduler";
import { useBiometrics } from "@/context/BiometricsContext";
import { useLifeScheduler } from "@/hooks/useLifeScheduler";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "./ui/sheet";
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

interface SidePanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DRAWER_WIDTH = 400;

export function SidePanel({ isOpen, onOpenChange }: SidePanelProps) {
  const { biometricData } = useBiometrics();
  const { memoryItems, addMemoryItem } = useLifeScheduler();
  const isMobile = useIsMobile();

  const bind = useDrag(({ swipe: [swipeX], movement: [mx], direction: [dx], cancel, last }) => {
    if (swipeX === 1 && !isOpen) onOpenChange(true);  // Swipe Right to open
    if (swipeX === -1 && isOpen) onOpenChange(false); // Swipe Left to close
    
    if (last) {
      if (!isOpen && dx > 0.5) onOpenChange(true);
      else if (isOpen && dx < -0.5) onOpenChange(false);
    }

    if (Math.abs(mx) > DRAWER_WIDTH) cancel();
  }, {
    axis: 'x',
    threshold: 15,
    swipeDistance: [30, 30],
  });

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
      <div {...bind()} className="touch-pan-x">
        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => onOpenChange(false)}
              />
              <motion.div
                initial={{ x: DRAWER_WIDTH }}
                animate={{ x: 0 }}
                exit={{ x: DRAWER_WIDTH }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="fixed top-0 right-0 w-[85vw] max-w-[400px] h-full bg-white border-l border-gray-200 z-50"
              >
                {content}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full border-l border-gray-200 bg-white h-full">
      {content}
    </div>
  );
}

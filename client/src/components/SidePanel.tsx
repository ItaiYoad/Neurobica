// SidePanel.tsx
"use client";

import { useSwipeable } from "react-swipeable";
import { ScrollArea } from "./ui/scroll-area";
import { BiometricChart } from "./biometrics/BiometricChart";
import { LifeScheduler } from "./scheduler/LifeScheduler";
import { useBiometrics } from "@/context/BiometricsContext";
import { useLifeScheduler } from "@/hooks/useLifeScheduler";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface SidePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DRAWER_WIDTH = 400;

export function SidePanel({ isOpen, onOpenChange }: SidePanelProps) {
  const { biometricData } = useBiometrics();
  const { memoryItems, addMemoryItem } = useLifeScheduler();
  const isMobile = useIsMobile();

  const swipeHandlers = useSwipeable({
    onSwipedRight: ({ event }) => {
      event.stopPropagation();
      onOpenChange(false);
    },
    trackTouch: true,
    delta: 50,
    enabled: isMobile,
  });

  const panelContent = (
    <ScrollArea className="h-full p-4">
      <div className="border-b pb-2 mb-4">
        <h2 className="font-semibold">Biometric Data</h2>
      </div>

      <BiometricChart data={biometricData} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-white border rounded-lg p-2 text-center">
          <div className="text-xs text-neutral-mid">Heart Rate</div>
          <div className="text-xl font-semibold text-[#F59E0B]">
            {biometricData.heartRate} <span className="text-xs">bpm</span>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-2 text-center">
          <div className="text-xs text-neutral-mid">EEG Alpha</div>
          <div className="text-xl font-semibold text-[#10B981]">
            {biometricData.eegAlpha.toFixed(1)}{" "}
            <span className="text-xs">μV</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <LifeScheduler
          memoryItems={memoryItems}
          onAddMemoryItem={addMemoryItem}
        />
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              {...swipeHandlers}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              {...swipeHandlers}
              initial={{ x: DRAWER_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: DRAWER_WIDTH }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className="fixed top-0 right-0 w-[85vw] max-w-[400px] h-full bg-white border-l border-gray-200 z-50"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: permanently visible with fixed width
  return (
    <div className="w-[22.5vw] border-l border-gray-200 bg-white h-full">
      {panelContent}
    </div>
  );
}

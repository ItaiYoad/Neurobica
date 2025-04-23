
import { ScrollArea } from "./ui/scroll-area";
import { BiometricChart } from "./biometrics/BiometricChart";
import { LifeScheduler } from "./scheduler/LifeScheduler";
import { useBiometrics } from "@/context/BiometricsContext";
import { useLifeScheduler } from "@/hooks/useLifeScheduler";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "./ui/drawer";

export function SidePanel() {
  const { biometricData } = useBiometrics();
  const { memoryItems, addMemoryItem } = useLifeScheduler();
  const isMobile = useIsMobile();

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
      <Drawer>
        <DrawerContent side="right" className="w-[85vw] max-w-[400px] h-full p-0">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="w-full border-l border-gray-200 bg-white h-full">
      {content}
    </div>
  );
}

import { BiometricSource } from "@/types";

interface BiometricSourceCardProps {
  source: BiometricSource;
}

export function BiometricSourceCard({ source }: BiometricSourceCardProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-neutral-light rounded-lg">
      <div className="flex items-center">
        <i className={`${source.icon} text-primary-dark mr-2`}></i>
        <span>{source.name}</span>
      </div>
      <span className={`h-2 w-2 ${source.connected ? 'bg-status-calm' : 'bg-status-alert'} rounded-full`}></span>
    </div>
  );
}

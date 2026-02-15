// components/security/scan-progress-bar.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScanProgressBarProps {
  progress: number;
  className?: string;
}

export function ScanProgressBar({ progress, className }: ScanProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <Progress value={progress} className="h-1.5" />
      <p className="mt-1 text-xs text-gray-500">{progress}%</p>
    </div>
  );
}

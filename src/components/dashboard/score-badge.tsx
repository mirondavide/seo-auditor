"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 50
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-red-100 text-red-800 border-red-200";

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 font-bold",
        color,
        sizes[size]
      )}
    >
      {score}
    </div>
  );
}

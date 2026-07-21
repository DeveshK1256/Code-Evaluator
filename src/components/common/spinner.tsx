import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)} role="status">
      <Loader2 className={cn("animate-spin", sizeClasses[size])} aria-hidden="true" />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isLoading?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ isLoading = true, label, className, children }: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      {label && (
        <p className="text-sm text-muted-foreground" role="status">
          {label}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

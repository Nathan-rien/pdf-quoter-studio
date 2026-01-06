import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockingMessageProps {
  message: string;
  variant?: "warning" | "info";
  className?: string;
}

export function BlockingMessage({
  message,
  variant = "warning",
  className,
}: BlockingMessageProps) {
  const Icon = variant === "warning" ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        variant === "warning"
          ? "bg-warning/10 text-warning border border-warning/20"
          : "bg-info/10 text-info border border-info/20",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

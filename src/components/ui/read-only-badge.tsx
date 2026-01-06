import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface ReadOnlyBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function ReadOnlyBadge({ className, size = "md" }: ReadOnlyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 bg-muted/50 border-border text-muted-foreground font-medium uppercase tracking-wide",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        className
      )}
    >
      <Lock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      Lecture seule
    </Badge>
  );
}

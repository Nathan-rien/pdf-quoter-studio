import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    container: "p-4",
    icon: "h-5 w-5",
    message: "text-sm",
    description: "text-xs",
  },
  md: {
    container: "p-6",
    icon: "h-8 w-8",
    message: "text-base",
    description: "text-sm",
  },
  lg: {
    container: "p-8",
    icon: "h-12 w-12",
    message: "text-lg",
    description: "text-base",
  },
};

export function LoadingState({
  message = "Chargement en cours...",
  description,
  size = "md",
  className,
}: LoadingStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      <Loader2
        className={cn(
          "animate-spin text-primary mb-3",
          styles.icon
        )}
      />
      <p className={cn("font-medium text-foreground", styles.message)}>
        {message}
      </p>
      {description && (
        <p className={cn("text-muted-foreground mt-1", styles.description)}>
          {description}
        </p>
      )}
    </div>
  );
}

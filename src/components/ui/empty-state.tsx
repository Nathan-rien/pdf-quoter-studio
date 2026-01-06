import { LucideIcon, Package, FileText, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "info" | "warning";
  className?: string;
}

const variantStyles = {
  info: {
    icon: "text-info",
    container: "border-border",
  },
  warning: {
    icon: "text-warning",
    container: "border-warning/30",
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "info",
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border-2 border-dashed",
        styles.container,
        className
      )}
    >
      <Icon className={cn("h-12 w-12 mb-4", styles.icon)} />
      <p className="text-lg font-medium mb-2">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { ReadOnlyBadge } from "./read-only-badge";
import { Badge } from "./badge";
import { AlertTriangle, Check, Circle, Lock } from "lucide-react";

type StepStatusType = "pending" | "active" | "complete" | "error" | "blocked";

interface StepHeaderProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  isReadOnly?: boolean;
  status?: StepStatusType;
  statusLabel?: string;
  className?: string;
}

const statusConfig: Record<
  StepStatusType,
  { variant: "pending" | "active" | "success" | "error" | "outline"; icon: typeof Check }
> = {
  pending: { variant: "pending", icon: Circle },
  active: { variant: "active", icon: Circle },
  complete: { variant: "success", icon: Check },
  error: { variant: "error", icon: AlertTriangle },
  blocked: { variant: "outline", icon: Lock },
};

export function StepHeader({
  stepNumber,
  totalSteps,
  title,
  description,
  isReadOnly = false,
  status,
  statusLabel,
  className,
}: StepHeaderProps) {
  const config = status ? statusConfig[status] : null;
  const StatusIcon = config?.icon;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="font-mono text-xs">
          Étape {stepNumber}/{totalSteps}
        </Badge>
        {isReadOnly && <ReadOnlyBadge size="sm" />}
        {status && statusLabel && StatusIcon && (
          <Badge variant={config.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusLabel}
          </Badge>
        )}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

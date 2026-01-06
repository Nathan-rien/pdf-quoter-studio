import { cn } from "@/lib/utils";
import { WorkflowStep, StepStatus } from "@/types/quote";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  DollarSign, 
  Settings, 
  Eye, 
  Download,
  Circle,
  AlertCircle,
  Lock
} from "lucide-react";

interface WorkflowStepIndicatorProps {
  step: WorkflowStep;
  label: string;
  status: StepStatus;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const stepIcons: Record<WorkflowStep, React.ComponentType<{ className?: string }>> = {
  'template': FileText,
  'excel-import': Upload,
  'invest-validation': CheckCircle,
  'csv-import': DollarSign,
  'options-selection': Settings,
  'preview': Eye,
  'export': Download,
};

const statusStyles: Record<StepStatus, { container: string; icon: string; label: string }> = {
  pending: {
    container: "border-border bg-muted/50",
    icon: "text-muted-foreground",
    label: "text-muted-foreground",
  },
  active: {
    container: "border-primary bg-primary/10 ring-2 ring-primary/20",
    icon: "text-primary",
    label: "text-primary font-semibold",
  },
  complete: {
    container: "border-success bg-success/10",
    icon: "text-success",
    label: "text-success",
  },
  error: {
    container: "border-destructive bg-destructive/10",
    icon: "text-destructive",
    label: "text-destructive",
  },
  blocked: {
    container: "border-muted bg-muted/30 opacity-60",
    icon: "text-muted-foreground",
    label: "text-muted-foreground",
  },
};

export function WorkflowStepIndicator({
  step,
  label,
  status,
  isActive,
  onClick,
  disabled = false,
}: WorkflowStepIndicatorProps) {
  const Icon = stepIcons[step];
  const styles = statusStyles[status];
  
  const StatusIcon = () => {
    if (status === 'complete') return <CheckCircle className="h-4 w-4 text-success absolute -top-1 -right-1" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive absolute -top-1 -right-1" />;
    if (status === 'blocked') return <Lock className="h-3 w-3 text-muted-foreground absolute -top-1 -right-1" />;
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'blocked'}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-w-[100px]",
        styles.container,
        !disabled && status !== 'blocked' && "hover:scale-105 cursor-pointer",
        disabled && "cursor-not-allowed"
      )}
    >
      <div className="relative">
        <div className={cn(
          "p-2 rounded-lg",
          status === 'active' && "bg-primary/20",
          status === 'complete' && "bg-success/20",
        )}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
        <StatusIcon />
      </div>
      <span className={cn("text-xs text-center leading-tight", styles.label)}>
        {label}
      </span>
    </button>
  );
}

interface WorkflowProgressProps {
  steps: { step: WorkflowStep; label: string; status: StepStatus }[];
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  canNavigateTo: (step: WorkflowStep) => boolean;
}

export function WorkflowProgress({
  steps,
  currentStep,
  onStepClick,
  canNavigateTo,
}: WorkflowProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((stepConfig, index) => (
          <div key={stepConfig.step} className="flex items-center">
            <WorkflowStepIndicator
              step={stepConfig.step}
              label={stepConfig.label}
              status={stepConfig.step === currentStep ? 'active' : stepConfig.status}
              isActive={stepConfig.step === currentStep}
              onClick={() => onStepClick(stepConfig.step)}
              disabled={!canNavigateTo(stepConfig.step)}
            />
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-8 mx-2 rounded-full transition-colors",
                stepConfig.status === 'complete' ? "bg-success" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

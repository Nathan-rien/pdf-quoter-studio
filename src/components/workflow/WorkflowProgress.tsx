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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowStepIndicatorProps {
  step: WorkflowStep;
  label: string;
  stepNumber: number;
  status: StepStatus;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
  blockReason?: string;
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
  stepNumber,
  status,
  isActive,
  onClick,
  disabled = false,
  blockReason,
}: WorkflowStepIndicatorProps) {
  const Icon = stepIcons[step];
  const styles = statusStyles[status];
  
  const StatusIcon = () => {
    if (status === 'complete') return <CheckCircle className="h-4 w-4 text-success absolute -top-1 -right-1" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive absolute -top-1 -right-1" />;
    if (status === 'blocked') return <Lock className="h-3 w-3 text-muted-foreground absolute -top-1 -right-1" />;
    return null;
  };

  const content = (
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
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-mono">{stepNumber}/7</span>
        <span className={cn("text-xs text-center leading-tight", styles.label)}>
          {label}
        </span>
      </div>
    </button>
  );

  if (blockReason && status === 'blocked') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{blockReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
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
  // Progress indicator
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-success transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedSteps}/{steps.length}
        </span>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((stepConfig, index) => {
          const canNavigate = canNavigateTo(stepConfig.step);
          const blockReason = !canNavigate ? "Complétez les étapes précédentes" : undefined;

          return (
            <div key={stepConfig.step} className="flex items-center">
              <WorkflowStepIndicator
                step={stepConfig.step}
                label={stepConfig.label}
                stepNumber={index + 1}
                status={stepConfig.step === currentStep ? 'active' : stepConfig.status}
                isActive={stepConfig.step === currentStep}
                onClick={() => onStepClick(stepConfig.step)}
                disabled={!canNavigate}
                blockReason={blockReason}
              />
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-8 mx-2 rounded-full transition-colors",
                  stepConfig.status === 'complete' ? "bg-success" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

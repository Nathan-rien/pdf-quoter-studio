import { cn } from "@/lib/utils";
import { 
  FileText, 
  Home,
  LayoutDashboard,
  Upload,
  CheckSquare,
  DollarSign,
  Settings,
  Eye,
  Download,
  History,
  ChevronRight,
  CheckCircle,
  Palette,
  Circle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowStep } from "@/types/quote";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppSidebarProps {
  currentView: 'dashboard' | 'workflow' | 'history' | 'template-editor';
  currentStep: WorkflowStep;
  onNavigate: (view: 'dashboard' | 'workflow' | 'history' | 'template-editor') => void;
  onStepNavigate: (step: WorkflowStep) => void;
  canNavigateTo: (step: WorkflowStep) => boolean;
  isWorkflowActive: boolean;
  stepStatuses?: Partial<Record<WorkflowStep, 'pending' | 'complete' | 'error'>>;
}

const workflowSteps: { step: WorkflowStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { step: 'template', label: 'Template', icon: FileText },
  { step: 'data-editor', label: 'Données', icon: Upload },
  { step: 'invest-validation', label: 'Validation Invest', icon: CheckSquare },
  { step: 'csv-import', label: 'Import Tarifs', icon: DollarSign },
  { step: 'options-selection', label: 'Options', icon: Settings },
  { step: 'preview', label: 'Aperçu', icon: Eye },
  { step: 'export', label: 'Export', icon: Download },
];

function getStepStatusIndicator(
  status: 'pending' | 'complete' | 'error' | undefined,
  canNavigate: boolean
) {
  if (!canNavigate) {
    return <Lock className="h-3 w-3 text-muted-foreground" />;
  }
  if (status === 'complete') {
    return <CheckCircle className="h-3 w-3 text-success" />;
  }
  if (status === 'error') {
    return <Circle className="h-3 w-3 text-destructive fill-destructive" />;
  }
  return <Circle className="h-3 w-3 text-muted-foreground" />;
}

export function AppSidebar({
  currentView,
  currentStep,
  onNavigate,
  onStepNavigate,
  canNavigateTo,
  isWorkflowActive,
  stepStatuses = {},
}: AppSidebarProps) {
  return (
    <aside className="w-52 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DevisGen</h1>
            <p className="text-xs text-muted-foreground">Générateur de devis</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Button
          variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-3"
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard className="h-4 w-4" />
          Tableau de bord
        </Button>

        <Button
          variant={currentView === 'history' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-3"
          onClick={() => onNavigate('history')}
        >
          <History className="h-4 w-4" />
          Historique
        </Button>

        {/* Section Administration */}
        <div className="pt-4 mt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
            Administration
          </p>
          <Button
            variant={currentView === 'template-editor' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onNavigate('template-editor')}
          >
            <Palette className="h-4 w-4" />
            Éditeur de Template
          </Button>
        </div>

        {/* Workflow steps */}
        {isWorkflowActive && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
              Workflow actif
            </p>
            <div className="space-y-1">
              <TooltipProvider>
                {workflowSteps.map(({ step, label, icon: Icon }, index) => {
                  const isActive = currentView === 'workflow' && currentStep === step;
                  const canNavigate = canNavigateTo(step);
                  const status = stepStatuses[step];
                  
                  const button = (
                    <Button
                      key={step}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        "w-full justify-start gap-3 text-sm",
                        !canNavigate && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canNavigate && onStepNavigate(step)}
                      disabled={!canNavigate}
                    >
                      <span className="w-5 text-xs font-mono text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{label}</span>
                      {isActive ? (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      ) : (
                        getStepStatusIndicator(status, canNavigate)
                      )}
                    </Button>
                  );

                  if (!canNavigate) {
                    return (
                      <Tooltip key={step}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-sm">Complétez les étapes précédentes</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </TooltipProvider>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          v1.0.0 • Production
        </p>
      </div>
    </aside>
  );
}

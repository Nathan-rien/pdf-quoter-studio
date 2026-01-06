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
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowStep } from "@/types/quote";

interface AppSidebarProps {
  currentView: 'dashboard' | 'workflow' | 'history';
  currentStep: WorkflowStep;
  onNavigate: (view: 'dashboard' | 'workflow' | 'history') => void;
  onStepNavigate: (step: WorkflowStep) => void;
  canNavigateTo: (step: WorkflowStep) => boolean;
  isWorkflowActive: boolean;
}

const workflowSteps: { step: WorkflowStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { step: 'template', label: 'Template', icon: FileText },
  { step: 'excel-import', label: 'Import Excel', icon: Upload },
  { step: 'invest-validation', label: 'Validation Invest', icon: CheckSquare },
  { step: 'csv-import', label: 'Import Tarifs', icon: DollarSign },
  { step: 'options-selection', label: 'Options', icon: Settings },
  { step: 'preview', label: 'Aperçu', icon: Eye },
  { step: 'export', label: 'Export', icon: Download },
];

export function AppSidebar({
  currentView,
  currentStep,
  onNavigate,
  onStepNavigate,
  canNavigateTo,
  isWorkflowActive,
}: AppSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
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

        {/* Workflow steps */}
        {isWorkflowActive && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
              Workflow actif
            </p>
            <div className="space-y-1">
              {workflowSteps.map(({ step, label, icon: Icon }) => {
                const isActive = currentView === 'workflow' && currentStep === step;
                const canNavigate = canNavigateTo(step);
                
                return (
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
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{label}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                );
              })}
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

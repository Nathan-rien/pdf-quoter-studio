import { cn } from "@/lib/utils";
import { 
  FileText, 
  History,
  Palette,
  Building2,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewType = 'rental-proposal' | 'rental-workflow' | 'history' | 'template-editor' | 'options-admin';

interface AppSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
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
          variant={currentView === 'rental-proposal' || currentView === 'rental-workflow' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-3"
          onClick={() => onNavigate('rental-proposal')}
        >
          <Building2 className="h-4 w-4" />
          Proposition
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
          <Button
            variant={currentView === 'options-admin' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onNavigate('options-admin')}
          >
            <Settings className="h-4 w-4" />
            Options Services
          </Button>
        </div>
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

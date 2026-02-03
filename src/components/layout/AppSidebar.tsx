import { cn } from "@/lib/utils";
import { 
  FileText, 
  History,
  Palette,
  Building2,
  Settings,
  Database,
  Users,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewType = 'rental-proposal' | 'rental-workflow' | 'history' | 'template-editor' | 'options-admin' | 'base-taux-admin' | 'access-management';

interface AppSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAdmin?: boolean;
  onSignOut?: () => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  isAdmin = false,
  onSignOut,
}: AppSidebarProps) {
  return (
    <aside className="w-44 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-bold text-base">DevisGen</h1>
            <p className="text-[10px] text-muted-foreground">Générateur de devis</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Button
          variant={currentView === 'rental-proposal' || currentView === 'rental-workflow' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-2 h-8 text-sm"
          onClick={() => onNavigate('rental-proposal')}
        >
          <Building2 className="h-3.5 w-3.5" />
          Proposition
        </Button>

        <Button
          variant={currentView === 'history' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-2 h-8 text-sm"
          onClick={() => onNavigate('history')}
        >
          <History className="h-3.5 w-3.5" />
          Historique
        </Button>

        {/* Section Administration */}
        <div className="pt-3 mt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Administration
          </p>
          <Button
            variant={currentView === 'template-editor' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 h-8 text-sm"
            onClick={() => onNavigate('template-editor')}
          >
            <Palette className="h-3.5 w-3.5" />
            Éditeur Template
          </Button>
          <Button
            variant={currentView === 'options-admin' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 h-8 text-sm"
            onClick={() => onNavigate('options-admin')}
          >
            <Settings className="h-3.5 w-3.5" />
            Options Services
          </Button>
          <Button
            variant={currentView === 'base-taux-admin' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 h-8 text-sm"
            onClick={() => onNavigate('base-taux-admin')}
          >
            <Database className="h-3.5 w-3.5" />
            Base Taux
          </Button>
          
          {/* Admin-only: Access Management */}
          {isAdmin && (
            <Button
              variant={currentView === 'access-management' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 h-8 text-sm"
              onClick={() => onNavigate('access-management')}
            >
              <Users className="h-3.5 w-3.5" />
              Accès
            </Button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {onSignOut && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-sm text-muted-foreground hover:text-foreground"
            onClick={onSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground text-center">
          v1.0.0 • Production
        </p>
      </div>
    </aside>
  );
}

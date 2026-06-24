import { cn } from "@/lib/utils";
import { 
  FileText, 
  FileCheck,
  History,
  Palette,
  Building2,
  Settings,
  Database,
  Users,
  LogOut,
  BarChart3,
  UserCircle,
  GanttChart,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useContracts, isContractRenewingSoon } from "@/hooks/useContracts";

const USEFUL_LINKS = [
  { label: "Projet prod", url: "https://quote-enricher.lovable.app/auth" },
  { label: "ERP", url: "https://jaja.cybertek.fr/magasin/vente.aspx" },
  { label: "Produit Destock", url: "https://data-shepherd-92.lovable.app/" },
  { label: "CRM", url: "https://app-eu1.hubspot.com/reports-dashboard/143332020/view/106706371/183256509" },
  { label: "Contact fournisseur", url: "https://cybertekfr-my.sharepoint.com/:o:/r/personal/z_azakri_cybertek-pro_fr/_layouts/15/Doc.aspx?sourcedoc=%7B95415c87-9bb9-4296-80ca-78674a5ecf30%7D&action=edit&wd=target(lenovo.one%7Cce05277c-e208-4cdc-b7b0-93dd3b6a1d4e%2FLenovo%7C4df99934-34b0-4cb2-b5c3-31a875dd9194%2F)&wdorigin=NavigationUrl" },
  { label: "Dossier commun", url: "https://cybertekfr-my.sharepoint.com/shared?id=%2Fsites%2Fequipe%5FB2B%2FShared%20Documents%2FGeneral&listurl=https%3A%2F%2Fcybertekfr%2Esharepoint%2Ecom%2Fsites%2Fequipe%5FB2B%2FShared%20Documents&viewid=a5737b31%2D7990%2D43a2%2D88ec%2D123f9ee56ea0" },
];

const TRANSPORT_LINKS = [
  { label: "TNT", url: "https://www.tnt.fr/mytnt/suivi_colis/recherche/detailbontransport.do" },
  { label: "Kuehne", url: "https://sso.kuehne-nagel.com/authorization/login" },
  { label: "Geodis", url: "https://parcelsapp.com/fr/carriers/geodis" },
  { label: "WelcomeTrack", url: "https://app.welcometrack.io/index.cfm" },
];

export type ViewType = 'rental-proposal' | 'rental-workflow' | 'history' | 'template-editor' | 'options-admin' | 'base-taux-admin' | 'access-management' | 'statistics' | 'mes-infos' | 'gantt';

interface AppSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAdmin?: boolean;
  canAccessAdmin?: boolean;
  isCommercial?: boolean;
  onSignOut?: () => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  isAdmin = false,
  canAccessAdmin = false,
  isCommercial = false,
  onSignOut,
}: AppSidebarProps) {
  return (
    <aside className="w-52 bg-card border-r border-border flex flex-col h-screen sticky top-0">
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

        {/* Onglet Mes infos - visible pour les commerciaux et les admins */}
        {(isCommercial || isAdmin) && (
          <Button
            variant={currentView === 'mes-infos' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2 h-8 text-sm"
            onClick={() => onNavigate('mes-infos')}
          >
            <UserCircle className="h-3.5 w-3.5" />
            Mes infos
          </Button>
        )}


        {/* Section Administration - masquée pour les commerciaux */}
        {canAccessAdmin && (
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
            
            {/* Admin-only: Statistics + Access Management */}
            {isAdmin && (
              <>
                <Button
                  variant={currentView === 'gantt' ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2 h-8 text-sm"
                  onClick={() => onNavigate('gantt')}
                >
                  <GanttChart className="h-3.5 w-3.5" />
                  Planning Gantt
                </Button>
                <Button
                  variant={currentView === 'statistics' ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2 h-8 text-sm"
                  onClick={() => onNavigate('statistics')}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Statistiques
                </Button>
                <Button
                  variant={currentView === 'access-management' ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2 h-8 text-sm"
                  onClick={() => onNavigate('access-management')}
                >
                  <Users className="h-3.5 w-3.5" />
                  Accès
                </Button>
              </>
            )}
          </div>
        )}
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

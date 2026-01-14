import { cn } from "@/lib/utils";
import { 
  Building2, 
  Plus, 
  History, 
  ChevronRight,
  FileText,
  FileUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRentalProposalStore } from "@/stores/rentalProposalStore";

interface RentalProposalDashboardProps {
  onNewProposal: () => void;
  onResumeProposal?: () => void;
  onViewHistory?: () => void;
}

export function RentalProposalDashboard({ onNewProposal, onResumeProposal, onViewHistory }: RentalProposalDashboardProps) {
  const { pdfImportStatus, lignesData, isActive } = useRentalProposalStore();
  
  const hasActiveProposal = isActive && pdfImportStatus.isImported;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent via-accent/90 to-accent/80 p-5 text-accent-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-accent-foreground/10 rounded-lg backdrop-blur-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Proposition</h1>
          </div>
          <p className="text-accent-foreground/80 max-w-xl mb-4 text-sm">
            Créez des propositions professionnelles avec vos conditions et tarifs personnalisés.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              size="default" 
              onClick={onNewProposal}
              className="gap-2 font-semibold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Nouvelle proposition
            </Button>
            {hasActiveProposal && (
              <Button 
                variant="ghost" 
                size="default" 
                onClick={onResumeProposal}
                className="gap-2 text-accent-foreground hover:bg-accent-foreground/10"
              >
                <ChevronRight className="h-4 w-4" />
                Reprendre la proposition en cours
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card 
          variant="interactive" 
          onClick={onNewProposal}
          className="group"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">Nouvelle proposition</h3>
                <p className="text-xs text-muted-foreground">
                  Démarrer une nouvelle proposition
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          variant={hasActiveProposal ? "interactive" : "default"} 
          onClick={hasActiveProposal ? onResumeProposal : undefined}
          className={cn(!hasActiveProposal && "opacity-60")}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">Reprendre</h3>
                <p className="text-xs text-muted-foreground">
                  {hasActiveProposal 
                    ? "Continuer la proposition en cours"
                    : "Aucune proposition en cours"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="interactive" onClick={onViewHistory}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-secondary transition-colors">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">Historique</h3>
                <p className="text-xs text-muted-foreground">
                  Consulter les propositions précédentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Current Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">État actuel</CardTitle>
            <CardDescription className="text-xs">Résumé des données chargées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">PDF Devis</span>
              </div>
              {pdfImportStatus.isImported ? (
                <Badge variant="success" className="text-xs">
                  {pdfImportStatus.source === 'cybertek' ? 'Cybertek Pro' : 'GrosBill Pro'}
                </Badge>
              ) : (
                <Badge variant="pending" className="text-xs">Non importé</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Fichier source</span>
              </div>
              {pdfImportStatus.fileName ? (
                <Badge variant="secondary" className="max-w-[160px] truncate text-xs">
                  {pdfImportStatus.fileName}
                </Badge>
              ) : (
                <Badge variant="pending" className="text-xs">-</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Lignes de produit</span>
              </div>
              <Badge variant={lignesData.length > 0 ? "success" : "pending"} className="text-xs">
                {lignesData.length} ligne(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workflow Proposition</CardTitle>
            <CardDescription className="text-xs">4 étapes pour créer votre proposition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">1</div>
                <span>Import PDF (Cybertek Pro / GrosBill Pro)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">2</div>
                <span>Édition des données extraites</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">3</div>
                <span>Aperçu de la proposition</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">4</div>
                <span>Export du document final</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

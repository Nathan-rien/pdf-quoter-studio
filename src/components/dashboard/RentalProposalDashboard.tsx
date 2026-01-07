import { cn } from "@/lib/utils";
import { 
  Building2, 
  Plus, 
  History, 
  ChevronRight,
  Sparkles,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuoteStore } from "@/stores/quoteStore";

interface RentalProposalDashboardProps {
  onNewProposal: () => void;
  onResumeProposal?: () => void;
  onViewHistory?: () => void;
}

export function RentalProposalDashboard({ onNewProposal, onResumeProposal, onViewHistory }: RentalProposalDashboardProps) {
  const { template, excelImport, csvImport, auditLogs } = useQuoteStore();
  
  const hasActiveProposal = template || excelImport;
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/90 to-accent/80 p-8 text-accent-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-foreground/10 rounded-lg backdrop-blur-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Proposition de Location</h1>
          </div>
          <p className="text-accent-foreground/80 max-w-xl mb-6">
            Créez des propositions de location professionnelles avec vos conditions et tarifs personnalisés.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={onNewProposal}
              className="gap-2 font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Nouvelle proposition
            </Button>
            {hasActiveProposal && (
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={onResumeProposal}
                className="gap-2 text-accent-foreground hover:bg-accent-foreground/10"
              >
                <ChevronRight className="h-5 w-5" />
                Reprendre la proposition en cours
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card 
          variant="interactive" 
          onClick={onNewProposal}
          className="group"
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Nouvelle proposition</h3>
                <p className="text-sm text-muted-foreground">
                  Démarrer une nouvelle proposition de location
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
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reprendre</h3>
                <p className="text-sm text-muted-foreground">
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
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-muted text-muted-foreground group-hover:bg-secondary transition-colors">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Historique</h3>
                <p className="text-sm text-muted-foreground">
                  Consulter les propositions précédentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">État actuel</CardTitle>
            <CardDescription>Résumé des données chargées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Template</span>
              </div>
              {template ? (
                <Badge variant="success">{template.name}</Badge>
              ) : (
                <Badge variant="pending">Non sélectionné</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Fichier Excel</span>
              </div>
              {excelImport ? (
                <Badge variant={excelImport.isValid ? "success" : "error"}>
                  {excelImport.fileName}
                </Badge>
              ) : (
                <Badge variant="pending">Non importé</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Tarifs CSV</span>
              </div>
              {csvImport ? (
                <Badge variant={csvImport.isValid ? "success" : "error"}>
                  Mis à jour {new Date(csvImport.importDate).toLocaleDateString('fr-FR')}
                </Badge>
              ) : (
                <Badge variant="pending">Non importé</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité récente</CardTitle>
            <CardDescription>Dernières actions effectuées</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      log.status === 'success' && "bg-success",
                      log.status === 'warning' && "bg-warning",
                      log.status === 'error' && "bg-destructive",
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune activité récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

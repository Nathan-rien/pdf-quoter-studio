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

      {/* Status Cards - 3 colonnes sur large écran */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Current Status */}
        <Card>
          <CardHeader className="pb-1 py-2 px-3">
            <CardTitle className="text-sm">État actuel</CardTitle>
            <CardDescription className="text-[10px]">Données chargées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 pb-3">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <FileUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">PDF Devis</span>
              </div>
              {pdfImportStatus.isImported ? (
                <Badge variant="success" className="text-[10px] h-5">
                  {pdfImportStatus.source === 'cybertek' ? 'Cybertek' : 'GrosBill'}
                </Badge>
              ) : (
                <Badge variant="pending" className="text-[10px] h-5">Non importé</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">Fichier</span>
              </div>
              {pdfImportStatus.fileName ? (
                <Badge variant="secondary" className="max-w-[100px] truncate text-[10px] h-5">
                  {pdfImportStatus.fileName}
                </Badge>
              ) : (
                <Badge variant="pending" className="text-[10px] h-5">-</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">Lignes</span>
              </div>
              <Badge variant={lignesData.length > 0 ? "success" : "pending"} className="text-[10px] h-5">
                {lignesData.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 py-2 px-3">
            <CardTitle className="text-sm">Workflow</CardTitle>
            <CardDescription className="text-[10px]">4 étapes</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">1</div>
                <span>Import PDF</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">2</div>
                <span>Édition données</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">3</div>
                <span>Aperçu</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">4</div>
                <span>Export final</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

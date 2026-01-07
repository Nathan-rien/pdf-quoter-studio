import { useDataEditorStore } from "@/stores/dataEditorStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Info, Euro, User, FileCheck } from "lucide-react";

// Structure exacte de l'onglet "Fiche Contrat" du fichier Excel
export function FicheContratEditor() {
  const { ficheContratData, updateFicheContratField } = useDataEditorStore();

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Fiche Contrat"</CardTitle>
              <CardDescription className="text-xs">
                Synthèse du contrat avec informations client, paramètres financiers et validation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section Client */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Client</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fc-client">Client</Label>
            <Input
              id="fc-client"
              value={ficheContratData.client || ''}
              onChange={(e) => updateFicheContratField('client', e.target.value || null)}
              placeholder="Nom du client"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-ic">IC (Ingénieur Commercial)</Label>
            <Input
              id="fc-ic"
              value={ficheContratData.contact || ''}
              onChange={(e) => updateFicheContratField('contact', e.target.value || null)}
              placeholder="Nom du commercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-gc">GC (Gestionnaire Commercial / ADV)</Label>
            <Input
              id="fc-gc"
              value={ficheContratData.gc || ''}
              onChange={(e) => updateFicheContratField('gc', e.target.value || null)}
              placeholder="Nom du gestionnaire"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fc-date">Date de démarrage</Label>
            <Input
              id="fc-date"
              type="date"
              value={typeof ficheContratData.dateDevis === 'string' ? ficheContratData.dateDevis : ''}
              onChange={(e) => updateFicheContratField('dateDevis', e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Paramètres financiers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Paramètres Financiers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Investissements</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono text-lg font-medium">
                {ficheContratData.investissements !== null 
                  ? `${ficheContratData.investissements.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` 
                  : '— €'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Onglet invest</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-duree">Durée (mois)</Label>
            <Input
              id="fc-duree"
              type="number"
              value={ficheContratData.dureeLocation || ''}
              onChange={(e) => updateFicheContratField('dureeLocation', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="36"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Échéances mensuelles</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono">
                {ficheContratData.echeancesMensuelles !== null 
                  ? `${ficheContratData.echeancesMensuelles.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT` 
                  : '— € HT'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Excel</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Échéances trimestrielles</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono">
                {ficheContratData.echeancesTrimestrielles !== null 
                  ? `${ficheContratData.echeancesTrimestrielles.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT` 
                  : '— € HT'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Excel</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-refi">Refinanceur</Label>
            <Input
              id="fc-refi"
              value={ficheContratData.partenaire || ''}
              onChange={(e) => updateFicheContratField('partenaire', e.target.value || null)}
              placeholder="Lixxbail 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Marge</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success rounded-md">
              <span className="font-mono font-medium">
                {ficheContratData.marge !== null 
                  ? `${ficheContratData.marge.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` 
                  : '— €'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto border-success/30">Excel</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marge / Investissements</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono">
                {ficheContratData.margeInvestissements !== null 
                  ? `${ficheContratData.margeInvestissements.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} %` 
                  : '— %'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Excel</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Facturation refi</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono">
                {ficheContratData.facturationRefi !== null 
                  ? `${ficheContratData.facturationRefi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` 
                  : '— €'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Excel</Badge>
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Facturation loyer intermédiaire</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono">
                {ficheContratData.facturationLoyerIntermediaire !== null 
                  ? `${ficheContratData.facturationLoyerIntermediaire.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` 
                  : '0.00 €'}
              </span>
              <Badge variant="outline" className="text-xs ml-auto">Excel</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Remarques */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Remarques</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ajoutez vos remarques ici..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Section Validation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Validation DA / DR</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Zone de validation pour DA / DR..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}

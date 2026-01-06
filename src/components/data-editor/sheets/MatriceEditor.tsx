import { useDataEditorStore } from "@/stores/dataEditorStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Calculator, Euro, Calendar, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Structure exacte de l'onglet "Matrice" du fichier Excel
export function MatriceEditor() {
  const { ficheContratData, updateFicheContratField, baseTauxData } = useDataEditorStore();

  // Get unique refinanceurs from Base Taux
  const refinanceurs = [...new Set(baseTauxData.map(r => r.partenaire))].filter(Boolean);

  // Calculs automatiques (lecture seule - affichés pour vérification)
  const duree = ficheContratData.dureeLocation || 36;
  const investissement = 0; // Will come from invest sheet
  const marge = 6; // Default marge

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Matrice"</CardTitle>
              <CardDescription className="text-xs">
                Paramètres de location, calculs automatiques et informations client. Les calculs sont déduits des autres onglets.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section Location */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Location</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="duree">Durée</Label>
            <div className="flex items-center gap-2">
              <Input
                id="duree"
                type="number"
                value={ficheContratData.dureeLocation || ''}
                onChange={(e) => updateFicheContratField('dureeLocation', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="36"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Mois</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Montant investissement</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">— HT</span>
              <Badge variant="outline" className="text-xs ml-auto">Onglet invest</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Loyer mensuel HT</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">— HT</span>
              <Badge variant="outline" className="text-xs ml-auto">Calculé</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Coût locatif annuel</Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <span className="font-mono text-sm">— %</span>
              <Badge variant="outline" className="text-xs ml-auto">Calculé</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Client */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Client</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="client">Nom du client</Label>
            <Input
              id="client"
              value={ficheContratData.client || ''}
              onChange={(e) => updateFicheContratField('client', e.target.value || null)}
              placeholder="Nom du client"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commercial">Commercial</Label>
            <Input
              id="commercial"
              value={ficheContratData.contact || ''}
              onChange={(e) => updateFicheContratField('contact', e.target.value || null)}
              placeholder="Nom du commercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv">ADV</Label>
            <Input
              id="adv"
              value={ficheContratData.email || ''}
              onChange={(e) => updateFicheContratField('email', e.target.value || null)}
              placeholder="Gestionnaire ADV"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Matrice (calculs) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Matrice</CardTitle>
            <Badge variant="outline" className="text-xs">Valeurs calculées</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Montant investissement</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              — HT
            </div>
          </div>

          <div className="space-y-2">
            <Label>Invest margé</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              — HT
            </div>
          </div>

          <div className="space-y-2">
            <Label>Services inclus loyers</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              —
            </div>
          </div>

          <div className="space-y-2">
            <Label>Durée</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              {duree} mois
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refi">Refinanceur</Label>
            <Select
              value={ficheContratData.partenaire || ''}
              onValueChange={(value) => updateFicheContratField('partenaire', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un refinanceur" />
              </SelectTrigger>
              <SelectContent>
                {refinanceurs.length > 0 ? (
                  refinanceurs.map((refi) => (
                    <SelectItem key={refi} value={refi}>{refi}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="lixxbail">Lixxbail 1</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Coefficient</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              —
            </div>
          </div>

          <div className="space-y-2">
            <Label>Coût du contrat</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              —
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marge">Marge appliquée (%)</Label>
            <Input
              id="marge"
              type="number"
              defaultValue={6}
              placeholder="6"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Marge loc</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              — €
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marge loyer intermédiaire</Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono text-sm">
              0.00 €
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total marge</Label>
            <div className="px-3 py-2 bg-success/10 text-success rounded-md font-mono text-sm font-medium">
              — €
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Date de livraison */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Date de livraison</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jourLivraison">Jour</Label>
            <Input
              id="jourLivraison"
              type="number"
              min={1}
              max={31}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moisLivraison">Mois</Label>
            <Select defaultValue="NA">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA (inconnu)</SelectItem>
                <SelectItem value="Janvier">Janvier</SelectItem>
                <SelectItem value="Février">Février</SelectItem>
                <SelectItem value="Mars">Mars</SelectItem>
                <SelectItem value="Avril">Avril</SelectItem>
                <SelectItem value="Mai">Mai</SelectItem>
                <SelectItem value="Juin">Juin</SelectItem>
                <SelectItem value="Juillet">Juillet</SelectItem>
                <SelectItem value="Août">Août</SelectItem>
                <SelectItem value="Septembre">Septembre</SelectItem>
                <SelectItem value="Octobre">Octobre</SelectItem>
                <SelectItem value="Novembre">Novembre</SelectItem>
                <SelectItem value="Décembre">Décembre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground sm:col-span-2">
            Si la date est inconnue, mettre 1 et NA
          </p>
        </CardContent>
      </Card>

      {/* Section Condition fin de contrat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Condition fin de contrat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm">Reprise à terme obligatoire loueur</span>
            <Badge variant="outline">Selon Bailleur / Loueur</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm">Cession client à terme possible</span>
            <Badge variant="outline">Selon Bailleur / Loueur</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Frais de dossier</span>
            <Badge variant="outline">60 € (Selon Bailleur / Loueur)</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

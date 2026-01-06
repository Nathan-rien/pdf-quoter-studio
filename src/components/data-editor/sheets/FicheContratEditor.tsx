import { useDataEditorStore, FicheContratData } from "@/stores/dataEditorStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

export function FicheContratEditor() {
  const { ficheContratData, updateFicheContratField, getSheetErrors } = useDataEditorStore();
  const errors = getSheetErrors('ficheContrat');

  const getFieldError = (field: keyof FicheContratData) => {
    return errors.find(e => e.column === field);
  };

  const handleChange = (field: keyof FicheContratData, value: string | number | null) => {
    updateFicheContratField(field, value === '' ? null : value);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Fiche Contrat"</CardTitle>
              <CardDescription className="text-xs">
                Informations du client et paramètres du contrat de location.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client">
              Client <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client"
              value={ficheContratData.client || ''}
              onChange={(e) => handleChange('client', e.target.value)}
              placeholder="Nom du client"
              className={getFieldError('client') ? 'border-destructive' : ''}
            />
            {getFieldError('client') && (
              <p className="text-xs text-destructive">{getFieldError('client')?.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              value={ficheContratData.siret || ''}
              onChange={(e) => handleChange('siret', e.target.value)}
              placeholder="123 456 789 00012"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={ficheContratData.adresse || ''}
              onChange={(e) => handleChange('adresse', e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codePostal">Code Postal</Label>
            <Input
              id="codePostal"
              value={ficheContratData.codePostal || ''}
              onChange={(e) => handleChange('codePostal', e.target.value)}
              placeholder="75001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              value={ficheContratData.ville || ''}
              onChange={(e) => handleChange('ville', e.target.value)}
              placeholder="Paris"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Input
              id="contact"
              value={ficheContratData.contact || ''}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="Nom du contact"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={ficheContratData.telephone || ''}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="01 23 45 67 89"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={ficheContratData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@client.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres du Contrat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="referenceDevis">Référence Devis</Label>
            <Input
              id="referenceDevis"
              value={ficheContratData.referenceDevis || ''}
              onChange={(e) => handleChange('referenceDevis', e.target.value)}
              placeholder="DEV-2025-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateDevis">Date du Devis</Label>
            <Input
              id="dateDevis"
              type="date"
              value={ficheContratData.dateDevis instanceof Date 
                ? ficheContratData.dateDevis.toISOString().split('T')[0] 
                : (ficheContratData.dateDevis as string) || ''
              }
              onChange={(e) => handleChange('dateDevis', e.target.value ? e.target.value : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dureeLocation">Durée de Location (mois)</Label>
            <Input
              id="dureeLocation"
              type="number"
              value={ficheContratData.dureeLocation || ''}
              onChange={(e) => handleChange('dureeLocation', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="36"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partenaire">Partenaire</Label>
            <Input
              id="partenaire"
              value={ficheContratData.partenaire || ''}
              onChange={(e) => handleChange('partenaire', e.target.value)}
              placeholder="Nom du partenaire financier"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

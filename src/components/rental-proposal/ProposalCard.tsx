import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PARTENAIRES, Partenaire } from '@/data/base-taux';
import { calculateAllMatriceValues, CalculatedMatriceValues } from '@/lib/rental-calculations';

export interface MatriceProposal {
  id: string;
  duree: number | null;
  refinanceur: Partenaire | null;
  margeAppliquee: number;
}

interface ProposalCardProps {
  proposal: MatriceProposal;
  index: number;
  montantInvestissement: number | null;
  optionsPrices: (number | null)[];
  canDelete: boolean;
  showCoutLocatifAnnuel: boolean;
  onUpdate: (updates: Partial<MatriceProposal>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProposalCard({
  proposal,
  index,
  montantInvestissement,
  optionsPrices,
  canDelete,
  showCoutLocatifAnnuel,
  onUpdate,
  onDuplicate,
  onDelete,
}: ProposalCardProps) {
  // Calculate values for this specific proposal
  const calculatedValues = calculateAllMatriceValues(
    montantInvestissement,
    proposal.duree,
    proposal.refinanceur,
    proposal.margeAppliquee,
    optionsPrices
  );

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)} %`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Proposition {index + 1}
            <Badge variant="outline" className="text-xs font-normal">
              {proposal.duree ?? '-'} mois
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onDuplicate}
              title="Dupliquer cette proposition"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onDelete}
              disabled={!canDelete}
              title="Supprimer cette proposition"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section Saisie - 4 champs en ligne */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Saisie</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`montant-${proposal.id}`} className="text-xs">Montant invest HT</Label>
              <div className="flex items-center h-10 px-3 bg-muted rounded-md text-sm">
                <span>{formatNumber(montantInvestissement)} €</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`duree-${proposal.id}`} className="text-xs">Durée (mois)</Label>
              <Input
                id={`duree-${proposal.id}`}
                type="number"
                min="12"
                step="12"
                value={proposal.duree ?? ''}
                onChange={(e) => onUpdate({ duree: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`refinanceur-${proposal.id}`} className="text-xs">Refinancement</Label>
              <Select
                value={proposal.refinanceur ?? ''}
                onValueChange={(value) => onUpdate({ refinanceur: value as Partenaire })}
              >
                <SelectTrigger id={`refinanceur-${proposal.id}`}>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {PARTENAIRES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`marge-${proposal.id}`} className="text-xs">Marge appliquée %</Label>
              <Input
                id={`marge-${proposal.id}`}
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={proposal.margeAppliquee}
                onChange={(e) => onUpdate({ margeAppliquee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Section Données - Structure 3 lignes comme sur le screenshot */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Données</h4>
          <div className="space-y-3">
            {/* Ligne 1 : 4 colonnes */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Montant invest</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{formatNumber(montantInvestissement)} € HT</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Investir Margé</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{formatNumber(calculatedValues.investMarge)} € HT</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Services loyers</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{calculatedValues.servicesInclusLoyers ? formatNumber(calculatedValues.servicesInclusLoyers) + ' €' : '- €'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Serv loyer inclus</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{calculatedValues.loyerServicesInclus ? formatNumber(calculatedValues.loyerServicesInclus) + ' €' : '- €'}</span>
                </div>
              </div>
            </div>

            {/* Ligne 2 : 4-5 colonnes avec loyer mensuel mis en avant */}
            <div className={`grid gap-3 ${showCoutLocatifAnnuel ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Durée</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{proposal.duree ?? '-'} mois</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Coefficient</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{calculatedValues.coefficient ?? '-'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Loyer invest msg</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{formatNumber(calculatedValues.loyerMensuelInvestissement)} €</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-medium">Loyer mensuel HT</Label>
                <div className="flex items-center h-9 px-2 bg-primary/10 rounded text-sm border border-primary/20">
                  <span className="font-semibold">{formatNumber(calculatedValues.loyerMensuel)} €</span>
                </div>
              </div>
              {showCoutLocatifAnnuel && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Coût locatif annuel</Label>
                  <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                    <span>{formatPercent(calculatedValues.coutLocatifAnnuel)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ligne 3 : 2 colonnes */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Coût du contrat</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{formatNumber(calculatedValues.coutContrat)} €</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Marge Loc</Label>
                <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                  <span>{formatNumber(calculatedValues.margeLoc)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

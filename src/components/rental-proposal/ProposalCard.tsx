import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PARTENAIRES, Partenaire } from '@/data/base-taux';
import { calculateAllMatriceValues } from '@/lib/rental-calculations';
import type { MatriceProposal } from '@/stores/rentalProposalStore';

interface ProposalCardProps {
  proposal: MatriceProposal;
  index: number;
  totalProposals: number;
  optionsPrices: (number | null)[];
  canDelete: boolean;
  showCoutLocatifAnnuel: boolean;
  onToggleCoutLocatif: (checked: boolean) => void;
  onUpdate: (updates: Partial<MatriceProposal>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProposalCard({
  proposal,
  index,
  totalProposals,
  optionsPrices,
  canDelete,
  showCoutLocatifAnnuel,
  onToggleCoutLocatif,
  onUpdate,
  onDuplicate,
  onDelete,
}: ProposalCardProps) {
  const montantInvestissement = proposal.montantInvestissement;

  const calculatedValues = calculateAllMatriceValues(
    montantInvestissement,
    proposal.duree,
    proposal.refinanceur,
    proposal.margeAppliquee,
    optionsPrices,
    proposal.coefficientOverride
  );

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  };

  return (
    <div className="space-y-4">
      {/* Card Saisie */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Saisie
              {totalProposals > 1 && (
                <Badge variant="outline" className="text-xs font-normal">
                  Proposition {index + 1}
                </Badge>
              )}
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
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`montant-${proposal.id}`} className="text-xs">Montant investissement HT</Label>
              <Input
                id={`montant-${proposal.id}`}
                type="number"
                min="0"
                step="0.01"
                value={montantInvestissement ?? ''}
                onChange={(e) => onUpdate({ montantInvestissement: e.target.value ? parseFloat(e.target.value) : null })}
              />
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
              <Label htmlFor={`marge-${proposal.id}`} className="text-xs">Marge appliquée (%)</Label>
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
        </CardContent>
      </Card>

      {/* Card Données */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Ligne 1 : 4 colonnes */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Montant investissement</Label>
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
              <Label className="text-xs text-muted-foreground">Les services comprennent des loyers</Label>
              <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                <span>{calculatedValues.servicesInclusLoyers ? formatNumber(calculatedValues.servicesInclusLoyers) + ' €' : '- €'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Services de loyer inclus</Label>
              <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                <span>{calculatedValues.loyerServicesInclus ? formatNumber(calculatedValues.loyerServicesInclus) + ' €' : '- €'}</span>
              </div>
            </div>
          </div>

          {/* Ligne 2 : 4-5 colonnes */}
          <div className={`grid gap-3 ${showCoutLocatifAnnuel ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Durée</Label>
              <div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
                <span>{proposal.duree ?? '-'} mois</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Coefficient</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                placeholder={calculatedValues.coefficientAuto !== null ? String(calculatedValues.coefficientAuto) : 'Auto'}
                value={proposal.coefficientOverride ?? ''}
                onChange={(e) => onUpdate({
                  coefficientOverride: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loyer investissement mensuel</Label>
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
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Coût locatif annuel</Label>
                  <Switch
                    checked={showCoutLocatifAnnuel}
                    onCheckedChange={onToggleCoutLocatif}
                    className="scale-75"
                  />
                </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

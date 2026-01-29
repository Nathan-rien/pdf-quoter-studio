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
        {/* Saisie */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`duree-${proposal.id}`}>Durée (mois)</Label>
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
            <Label htmlFor={`refinanceur-${proposal.id}`}>Refinanceur</Label>
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
            <Label htmlFor={`marge-${proposal.id}`}>Marge (%)</Label>
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

        {/* Données calculées */}
        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Invest margé</Label>
            <div className="flex items-center h-8 px-2 bg-muted rounded text-sm">
              <span>{formatNumber(calculatedValues.investMarge)} €</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Coefficient</Label>
            <div className="flex items-center h-8 px-2 bg-muted rounded text-sm">
              <span>{calculatedValues.coefficient ?? '-'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Loyer mensuel HT</Label>
            <div className="flex items-center h-8 px-2 bg-primary/10 rounded text-sm border border-primary/20">
              <span className="font-medium">{formatNumber(calculatedValues.loyerMensuel)} €</span>
            </div>
          </div>
          {showCoutLocatifAnnuel && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Coût locatif annuel</Label>
              <div className="flex items-center h-8 px-2 bg-muted rounded text-sm">
                <span>{formatPercent(calculatedValues.coutLocatifAnnuel)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


## Rendre le champ "Coefficient" modifiable

### Contexte technique

Actuellement, dans `ProposalCard.tsx` (lignes 192-197), le champ Coefficient est purement en lecture seule :
```tsx
<div className="flex items-center h-9 px-2 bg-muted rounded text-sm">
  <span>{calculatedValues.coefficient ?? '-'}</span>
</div>
```

La valeur de `coefficient` est calculée automatiquement par `lookupCoefficient()` dans `calculateAllMatriceValues()` — elle cherche dans la table Base Taux le taux correspondant au partenaire, au montant et à la durée.

La demande est de permettre à l'utilisateur de **saisir manuellement** une valeur de coefficient, qui prime sur la valeur calculée automatiquement. Si l'utilisateur laisse le champ vide, la valeur auto s'applique.

---

### Modifications nécessaires

**1. `src/stores/rentalProposalStore.ts` — Ajouter `coefficientOverride` dans `MatriceProposal`**

```typescript
export interface MatriceProposal {
  id: string;
  montantInvestissement: number | null;
  duree: number | null;
  refinanceur: Partenaire | null;
  margeAppliquee: number;
  coefficientOverride: number | null;  // ← AJOUT : null = utiliser la valeur auto
}
```

Et dans `createDefaultProposal()` :
```typescript
const createDefaultProposal = (): MatriceProposal => ({
  ...
  coefficientOverride: null,  // ← AJOUT
});
```

**2. `src/lib/rental-calculations.ts` — Accepter un coefficient forcé dans `calculateAllMatriceValues`**

```typescript
export function calculateAllMatriceValues(
  montantInvestissement: number | null,
  duree: number | null,
  refinanceur: string | null,
  margeAppliquee: number,
  optionsPrices: (number | null)[],
  coefficientOverride?: number | null   // ← AJOUT
): CalculatedMatriceValues {
  // Lookup coefficient (auto), sauf si override fourni
  const coefficientAuto = lookupCoefficient(refinanceur, montantInvestissement, duree);
  const coefficient = (coefficientOverride != null) ? coefficientOverride : coefficientAuto;
  ...
}
```

**3. `src/components/rental-proposal/ProposalCard.tsx` — Remplacer le div par un Input**

- Passer `coefficientOverride` au composant
- Appeler `calculateAllMatriceValues` avec le `coefficientOverride`
- Afficher un `Input` de type `number` à la place du div en lecture seule
- Afficher en placeholder la valeur calculée automatiquement (pour indiquer ce qu'on utilise si laissé vide)
- Si la valeur saisie est effacée, repasser à `null` → retour au calcul auto

```tsx
<div className="space-y-1">
  <Label className="text-xs text-muted-foreground">Coefficient</Label>
  <Input
    type="number"
    step="0.0001"
    placeholder={coefficientAuto !== null ? String(coefficientAuto) : 'Auto'}
    value={proposal.coefficientOverride ?? ''}
    onChange={(e) => onUpdate({ 
      coefficientOverride: e.target.value ? parseFloat(e.target.value) : null 
    })}
  />
</div>
```

---

### Résumé des fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Ajouter `coefficientOverride: number | null` dans `MatriceProposal` et `createDefaultProposal` |
| `src/lib/rental-calculations.ts` | Accepter `coefficientOverride` en paramètre optionnel dans `calculateAllMatriceValues` |
| `src/components/rental-proposal/ProposalCard.tsx` | Remplacer le div lecture seule par un `Input` éditable, avec placeholder = valeur auto |

### Comportement final

- Par défaut, le coefficient est calculé automatiquement depuis la Base Taux (comportement inchangé)
- L'utilisateur peut saisir une valeur manuelle dans le champ Coefficient
- Si le champ est vidé, la valeur auto reprend
- Tous les calculs dépendants (Loyer mensuel, Loyer investissement, Coût contrat, Marge Loc…) se mettent à jour instantanément avec le coefficient forcé



## Rendre les cases "Nos Options" vides dans le PDF (sans toucher aux Services)

### Problème
Ligne 596 de `RentalProposalExport.tsx`, la checkbox des "Nos Options" reflète `opt.selected` (fond bleu + ✓). Les **Services** doivent rester cochés comme actuellement — seules les **Nos Options** doivent avoir des cases vides.

### Correction (1 fichier, 1 ligne)

**`src/components/rental-proposal/RentalProposalExport.tsx`** — ligne 596 :

Forcer la checkbox à toujours être vide (bordure grise, pas de fond, pas de ✓) :

```typescript
// Avant :
<span style="...border: 1px solid ${opt.selected ? '#2563eb' : '#6b7280'}; ...background: ${opt.selected ? '#2563eb' : 'transparent'}; ...">${opt.selected ? '✓' : ''}</span>

// Après :
<span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #6b7280; border-radius: 2px; background: transparent; color: white; text-align: center; line-height: 10px; font-size: 8px;"></span>
```

La fonction `makeOptionHTML` (Services inclus) n'est **pas modifiée** — les services restent cochés comme avant.


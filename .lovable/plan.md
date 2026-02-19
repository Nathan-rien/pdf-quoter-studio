
## Masquer les prix des options dans l'aperçu et le PDF

### Problème identifié

Dans la section "Les services inclus dans votre offre" (Page 5), les prix des options (ex : `10,00 €/mois`) sont affichés dans :
- **L'aperçu** (`RentalProposalPreview.tsx`) — 4 endroits différents
- **L'export PDF** (`RentalProposalExport.tsx`) — 2 endroits

L'utilisateur souhaite que ces prix n'apparaissent plus, que ce soit dans l'aperçu ou dans le PDF généré.

### Fichiers à modifier

#### 1. `src/components/rental-proposal/RentalProposalPreview.tsx`

Supprimer les 4 blocs conditionnels affichant le prix :

**Lignes 946-950** — Options additionnelles (optionsServices) sur Page 5 :
```tsx
// SUPPRIMER :
{option.price !== null && (
  <span className="ml-auto text-[10px] text-primary font-medium">
    {formatNumber(option.price)} €/mois
  </span>
)}
```

**Lignes 987-991** — Nos Options fusionnées sur Page 5 :
```tsx
// SUPPRIMER :
{option.price !== null && (
  <span className="ml-auto text-[10px] text-primary font-medium">
    {formatNumber(option.price)} €/mois
  </span>
)}
```

**Lignes 1047-1051** — Nos Options sur Page 6 (ancienne page dédiée) :
```tsx
// SUPPRIMER :
{option.price !== null && (
  <span className="ml-auto text-[11px] text-primary font-medium">
    {formatNumber(option.price)} €/mois
  </span>
)}
```

**Lignes 1125-1129** — Autres occurrences potentielles :
```tsx
// SUPPRIMER :
{option.price !== null && (
  <span className="ml-auto text-[9px] text-primary font-medium">
    {formatNumber(option.price)} €/mois
  </span>
)}
```

#### 2. `src/components/rental-proposal/RentalProposalExport.tsx`

Supprimer les 2 blocs conditionnels affichant le prix dans le HTML généré pour le PDF :

**Lignes 466-471** — Options additionnelles (optionsServices) :
```typescript
// SUPPRIMER :
${opt.price !== null ? `
  <div style="text-align: right;">
    <span style="font-weight: 600; color: #2563eb; font-size: 9px;">${formatNumber(opt.price)} €</span>
    <span style="display: block; font-size: 7px; color: #9ca3af;">/mois</span>
  </div>
` : ''}
```

**Lignes 494-498** — Nos Options :
```typescript
// SUPPRIMER :
${opt.price !== null ? `
  <div style="text-align: right; white-space: nowrap;">
    <span style="font-weight: 600; color: #374151; font-size: 9px;">${formatNumber(opt.price)} € / mois</span>
  </div>
` : ''}
```

### Résultat attendu

| Avant | Après |
|-------|-------|
| Titre de l'option + `10,00 €/mois` à droite | Titre de l'option uniquement |
| Prix affiché en bleu dans le PDF | Aucun prix visible |

Les prix restent stockés dans les données (pour d'éventuels calculs internes) mais ne sont plus rendus visuellement dans l'aperçu ni dans le PDF exporté.

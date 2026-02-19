
## Réafficher les prix uniquement dans le bloc "Nos Options"

### Contexte

La correction précédente a supprimé l'affichage des prix pour **toutes** les options. Or la règle est :
- **Services inclus** (`selectedOptions`) → prix **masqués** (déjà correct)
- **Nos Options** (`selectedNosOptions`) → prix doivent **apparaître**

Les prix sont stockés dans le champ `price: number | null` de chaque `NosOption`/`OptionService`.

### Fichiers à modifier

#### 1. `src/components/rental-proposal/RentalProposalPreview.tsx` — Bloc Nos Options (aperçu)

Dans `renderNosOptionsPage` (lignes 1032-1055), le header de chaque carte affiche uniquement le nom. Il faut ajouter le prix à droite, comme il existait avant :

**Avant (ligne 1034-1037)** :
```tsx
<div className="bg-muted px-4 py-2 flex items-center gap-2">
  <div className="h-4 w-4 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[14px]">{option.name}</span>
</div>
```

**Après** :
```tsx
<div className="bg-muted px-4 py-2 flex items-center gap-2">
  <div className="h-4 w-4 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[14px]">{option.name}</span>
  {option.price !== null && option.price !== undefined && (
    <span className="ml-auto text-[11px] text-primary font-medium whitespace-nowrap">
      {formatNumber(option.price)} €/mois
    </span>
  )}
</div>
```

#### 2. `src/components/rental-proposal/RentalProposalExport.tsx` — Bloc Nos Options (PDF)

Dans la génération HTML de `nosOptionsHTML` (lignes 477-491), le `div` intérieur n'affiche pas de prix. Il faut ajouter le prix en haut à droite du nom, en `flex justify-content: space-between` :

**Avant (ligne 482-485)** :
```typescript
<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
  <span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #6b7280; border-radius: 2px;"></span>
  <span style="font-weight: 600; font-size: 9px;">${opt.name}</span>
</div>
```

**Après** :
```typescript
<div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
  <div style="display: flex; align-items: center; gap: 4px;">
    <span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #6b7280; border-radius: 2px;"></span>
    <span style="font-weight: 600; font-size: 9px;">${opt.name}</span>
  </div>
  ${opt.price !== null && opt.price !== undefined ? `
    <span style="font-weight: 600; color: #374151; font-size: 9px; white-space: nowrap;">${formatNumber(opt.price)} € / mois</span>
  ` : ''}
</div>
```

### Résultat attendu

| Section | Prix affiché ? |
|---------|---------------|
| Services location (permanent) | Non |
| Services inclus additionnels | Non |
| **Nos Options** | **Oui** : `9,00 € / mois` en haut à droite |

### Fichiers modifiés
- `src/components/rental-proposal/RentalProposalPreview.tsx` — ligne ~1034-1037
- `src/components/rental-proposal/RentalProposalExport.tsx` — lignes ~480-488

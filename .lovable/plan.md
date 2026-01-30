
# Plan : Nettoyage de l'affichage des pages PDF

## Modifications demandées

1. **Page 5 (Votre offre)** : Supprimer la ligne "Sous-total HT"
2. **Page Votre Offre** : Retirer les couleurs bleues automatiques (Total investissement, Loyer mensuel HT)
3. **Page Services** : Retirer la mention "Aucune option additionnelle sélectionnée"

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Supprimer "Sous-total HT", retirer `text-primary` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Supprimer "Sous-total HT", retirer `color: #2563eb`, supprimer message "aucune option" |

---

## Détail des modifications

### 1. RentalProposalPreview.tsx

#### Supprimer "Sous-total HT" (lignes 751-755)

Supprimer la div contenant "Sous-total HT" et le Separator associé :

```tsx
// AVANT
<div className="bg-primary/5 rounded-lg p-3 min-w-[180px]">
  <div className="flex justify-between text-[10px] mb-1 gap-3">
    <span className="text-muted-foreground">Sous-total HT :</span>
    <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
  </div>
  <Separator className="my-1.5" />
  <div className="flex justify-between font-semibold text-[10px] gap-3">
    <span>Total investissement :</span>
    <span className="text-primary">{formatNumber(matriceData.montantInvestissement)} € HT</span>
  </div>
</div>

// APRÈS
<div className="bg-primary/5 rounded-lg p-3 min-w-[180px]">
  <div className="flex justify-between font-semibold text-[10px] gap-3">
    <span>Total investissement :</span>
    <span>{formatNumber(matriceData.montantInvestissement)} € HT</span>
  </div>
</div>
```

#### Retirer couleur bleue sur "Loyer mensuel HT" (ligne 784)

```tsx
// AVANT
<span className="font-semibold text-primary">{formatNumber(calculations.loyerMensuel)} € HT</span>

// APRÈS
<span className="font-semibold">{formatNumber(calculations.loyerMensuel)} € HT</span>
```

---

### 2. RentalProposalExport.tsx

#### Supprimer "Sous-total HT" (lignes 314-318)

```html
<!-- AVANT -->
<div class="summary-box" style="min-width: 180px;">
  <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px;">
    <span style="color: #6b7280;">Sous-total HT :</span>
    <span style="font-weight: 600;">... €</span>
  </div>
  <hr style="...">
  <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600;">
    <span>Total investissement :</span>
    <span style="color: #2563eb;">... € HT</span>
  </div>
</div>

<!-- APRÈS -->
<div class="summary-box" style="min-width: 180px;">
  <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600;">
    <span>Total investissement :</span>
    <span>... € HT</span>
  </div>
</div>
```

#### Retirer couleur bleue sur "Loyer mensuel HT" (ligne 290)

```html
<!-- AVANT -->
<td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #2563eb;">...</td>

<!-- APRÈS -->
<td style="padding: 6px 8px; text-align: right; font-weight: 600;">...</td>
```

#### Supprimer message "Aucune option additionnelle sélectionnée" (ligne 404)

```tsx
// AVANT
${selectedOptions.length > 0 ? optionsHTML : '<p style="text-align: center; padding: 12px; color: #9ca3af; font-size: 9px;">Aucune option additionnelle sélectionnée</p>'}

// APRÈS
${selectedOptions.length > 0 ? optionsHTML : ''}
```

---

## Résumé des changements

| Page | Élément | Action |
|------|---------|--------|
| Page 5 (Votre offre) | Ligne "Sous-total HT" | Supprimée |
| Page 5 (Votre offre) | "Total investissement" | Couleur bleue retirée |
| Page 5 (Votre offre) | "Loyer mensuel HT" | Couleur bleue retirée |
| Page 5 (Services) | "Aucune option additionnelle sélectionnée" | Message supprimé |

## Points techniques

- Les modifications s'appliquent à l'aperçu (Preview) ET au PDF exporté pour garantir la cohérence WYSIWYG
- Les valeurs numériques conservent leur mise en forme (gras)
- L'encart "Total investissement" reste visible mais sans couleur bleue

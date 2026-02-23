

## Rendre les lignes de separation visibles dans l'apercu et le PDF

### Probleme

Les lignes marquees `isSeparator: true` sont rendues comme des lignes produits normales dans l'apercu (Preview) et le PDF exporte. Elles affichent une quantite de 0, un prix unitaire vide et un total de 0,00 au lieu d'apparaitre comme des bandeaux bleus avec leur description.

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~803-818)

Dans le rendu du tableau des produits (boucle `pageLines.map`), ajouter une condition sur `ligne.isSeparator` :
- Si `isSeparator === true` : rendre une ligne pleine largeur (`col-span-12` ou `col-span-8` selon `investShowPrices`) avec un fond bleu ciel (`bg-blue-50`), affichant la designation en gras comme titre de section
- Sinon : garder le rendu actuel (designation, quantite, prix unitaire, total HT)

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~309-313)

Dans la fonction `makeRowHTML`, ajouter une condition similaire :
- Si `ligne.isSeparator === true` : generer un `<tr>` avec un seul `<td colspan="4">` (ou 2 si prix masques), fond `#EFF6FF` (equivalent de `bg-blue-50`), texte en gras, affichant la designation
- Sinon : garder le HTML actuel

### Detail technique

Apercu (Preview) - rendu conditionnel dans le `.map()` :
```
Si ligne.isSeparator :
  -> div pleine largeur, bg-blue-50, border-blue-100
  -> Texte de la designation en semi-bold, taille 8px
Sinon :
  -> Rendu grille standard (designation, qte, PU, total)
```

Export PDF (HTML) - rendu conditionnel dans `makeRowHTML` :
```
Si ligne.isSeparator :
  -> <tr><td colspan="4" style="background:#EFF6FF; font-weight:600; padding:6px 8px;">
       designation
     </td></tr>
Sinon :
  -> HTML standard existant
```

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Rendu conditionnel des separateurs dans le tableau produits (fond bleu, pleine largeur) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Rendu HTML conditionnel des separateurs dans `makeRowHTML` (colspan, fond bleu) |


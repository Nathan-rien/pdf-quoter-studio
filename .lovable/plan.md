

## Harmoniser la typographie du commentaire avec les titres Avantages/Conditions

### Probleme

Le texte saisi dans le champ "Commentaire" s'affiche sur la Page 4 avec une taille de base de 26px et sans police explicite. Les titres "Avantages" et "Condition de l'offre" utilisent 28px en police Garet (Outfit). Le commentaire doit adopter la meme taille et la meme police.

### Modifications

| Fichier | Changement |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` (ligne 1032) | Changer la taille de base de 26 a 28, ajouter `fontFamily: 'Outfit, sans-serif'` |
| `src/components/rental-proposal/RentalProposalExport.tsx` (ligne 465) | Changer `font-size: 12px` a `font-size: 14px` et ajouter `font-family: Outfit, sans-serif` pour correspondre au ratio d'export |

### Detail technique

**Preview (RentalProposalPreview.tsx, ligne 1032)**

Le style inline passe de :
```text
fontSize: Math.max(26 * PREVIEW_FONT_SCALE, 8)  (= 10.4px)
```
a :
```text
fontSize: Math.max(28 * PREVIEW_FONT_SCALE, 8)  (= 11.2px)
fontFamily: 'Outfit, sans-serif'
```

**Export PDF (RentalProposalExport.tsx, ligne 465)**

Le style inline passe de :
```text
font-size: 12px
```
a :
```text
font-size: 14px; font-family: Outfit, sans-serif
```

Le ratio 28 -> 14px correspond au facteur d'echelle standard de l'export PDF (x0.5 par rapport a la base template).


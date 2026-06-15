## Modifications page Reprise (preview + export PDF)

1. **Supprimer l'affichage VUN/VTN** sur les lignes produits : la cellule fusionnée (colSpan=4) "VUN x € · VTN x €" est remplacée par 4 cellules vides, quel que soit `repriseShowPrices`.
2. **Déplacer les en-têtes A / B / C / D** : ils ne figurent plus dans le `<thead>` noir (qui ne contient plus que `Description` et `Quantités`, couvrant les 6 colonnes via colSpan adapté), mais sont rendus dans la ligne grise "SYNTHÈSE" (colonnes 3 à 6) en gras, juste au-dessus des lignes Total HT / TVA / Total TTC.

Résultat visuel cible (cf. screenshot fourni) :

```text
┌──────────────────────────────────────────────────────────┐
│ Description          Quantités                            │  ← thead noir
├──────────────────────────────────────────────────────────┤
│ TEST produit 01        1                                  │
│ TEST produit 02        1                                  │
│ TEST produit 03        1                                  │
├──────────────────────────────────────────────────────────┤
│ SYNTHÈSE                       A     B     C     D        │  ← bandeau gris
├──────────────────────────────────────────────────────────┤
│ Total HT                    1544  1080   432   400        │
│ TVA                          308   216    86    80        │
│ Total TTC                   1852  1296   518   480        │  ← bandeau noir
└──────────────────────────────────────────────────────────┘
```

## Fichiers à modifier

- `src/components/rental-proposal/RentalProposalPreview.tsx` — `renderReprisePage`
- `src/components/rental-proposal/RentalProposalExport.tsx` — bloc `repriseHTML`

## Non-régression

- Toggle `repriseShowPrices` n'a plus d'effet sur cette page (VUN/VTN jamais affichés ici), l'onglet d'édition Reprise reste inchangé.
- Calculs, pagination, insertion après dernière page Invest : inchangés.

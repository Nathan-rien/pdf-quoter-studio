## Objectif

Sur la page Reprise insérée après la dernière page Invest (preview + export PDF), fusionner les "Lignes produits (Reprise)" et la "Synthèse reprise" dans **un seul tableau**, à la place du tableau de synthèse seul actuellement affiché.

## Layout proposé

Un seul tableau bordé avec un en-tête noir unique :

```text
| Description | Quantités | A | B | C | D |
```

Sections successives dans le même `<tbody>` :

1. **Lignes produits** (issues de `repriseData.lignes`, dans l'ordre)
   - Séparateurs (`isSeparator: true`) → ligne grisée pleine largeur (colSpan=6) avec la désignation en gras.
   - Lignes normales :
     - col Description = `designation`
     - col Quantités = `nb`
     - cols A/B/C/D :
       - si `matriceData.repriseShowPrices === true` → fusionnées (colSpan=4) affichant `VUN x,xx € · VTN x,xx €` aligné à droite
       - sinon → cellules vides
2. **Sous-en-tête "Synthèse"** : ligne de séparation discrète (fond gris clair) pour marquer la transition.
3. **Synthèse reprise** (inchangée fonctionnellement) :
   - Total HT (A/B/C/D)
   - TVA (A/B/C/D)
   - Total TTC (ligne noire, texte blanc)
4. **Descriptions libres** (`repriseData.descriptions`) : `description` + `quantite`, cols A/B/C/D vides.

Le titre "Synthèse reprise" au-dessus du tableau est conservé.

## Fichiers à modifier

- `src/components/rental-proposal/RentalProposalPreview.tsx`
  - `renderReprisePage` (≈ l. 1434-1490) : remplacer le `<tbody>` actuel par les 4 sections décrites, en utilisant `repriseData.lignes` et `matriceData.repriseShowPrices`.
- `src/components/rental-proposal/RentalProposalExport.tsx`
  - Bloc `repriseHTML` (≈ l. 547-596) : même fusion en HTML statique pour l'export PDF (`window.print()`).

## Non-régression

- Aucune modification des calculs (`reprise-calculations.ts`), du store, ni de l'onglet Reprise (édition).
- Pagination, insertion après dernière page Invest, et toggle `showReprise` inchangés.
- Formatage `fr-FR` 2 décimales conservé ; pas de nouvelle dépendance.

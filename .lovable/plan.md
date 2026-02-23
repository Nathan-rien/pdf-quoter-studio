

## Corriger l'injection des frais de dossier dans l'export PDF

### Probleme
Le montant des frais de dossier n'apparait plus dans le PDF exporte (affiche "–" au lieu du montant reel).

### Cause racine
Dans `RentalProposalExport.tsx`, la fonction `generatePDFContentFromTemplate` est wrappee dans un `useCallback` dont le tableau de dependances (ligne 596) ne contient ni `calculatedValues` ni `selectedCommercial`. Le closure capture donc des valeurs perimees (initiales/nulles) de `calculatedValues.fraisDossier` et `selectedCommercial?.adresse`.

```text
// Ligne 596 actuelle :
}, [latestVersion, activeTemplate, generateDynamicContentByPage]);

// Correction :
}, [latestVersion, activeTemplate, generateDynamicContentByPage, calculatedValues, selectedCommercial]);
```

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Ajouter `calculatedValues` et `selectedCommercial` dans les dependances du `useCallback` de `generatePDFContentFromTemplate` (ligne 596) |

### Impact
Aucun changement de comportement ou de rendu. Le seul effet est que les valeurs financieres (frais de dossier, adresse entite) seront correctement a jour au moment de la generation du PDF.


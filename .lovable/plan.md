

## Problème identifié

Le nom de fichier PDF est déterminé par la balise `<title>` du document HTML généré, pas par la fonction `generateFileName()`. La ligne 535 de `src/lib/pdf-html-generator.ts` contient un titre en dur :

```html
<title>Proposition de Location</title>
```

Le navigateur utilise ce `<title>` comme nom de fichier par défaut lors de l'impression en PDF, ce qui donne toujours "Proposition de Location.pdf".

## Correction

| Fichier | Ligne | Changement |
|---|---|---|
| `src/lib/pdf-html-generator.ts` | 463-469 | Ajouter un paramètre `documentTitle?: string` à `generatePDFDocumentHTML` |
| `src/lib/pdf-html-generator.ts` | 535 | Remplacer le titre en dur par le paramètre dynamique |
| `src/components/rental-proposal/RentalProposalExport.tsx` | ~ligne d'appel de `generatePDFDocumentHTML` | Passer `generateFileName().replace('.pdf', '')` comme titre du document |

Le titre deviendra par exemple : `Proposition_commerciale_Dupont_SAS_2026-02-27`


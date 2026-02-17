

## Augmenter les marges laterales du template PDF

### Probleme

Les contenus dynamiques (tableaux, options, services) utilisent actuellement `left: 3%; width: 94%`, ce qui donne environ 17px de marge de chaque cote sur un canvas de 580px. Le rendu parait trop "bord a bord".

### Solution

Ajouter un `padding` horizontal au conteneur `.page` dans le generateur PDF, et ajuster les positionnements `left`/`width` des contenus dynamiques pour harmoniser les marges.

Passer de `left: 3%; width: 94%` a `left: 5%; width: 90%` sur tous les blocs dynamiques, ce qui donnera environ 29px de marge de chaque cote (contre 17px actuellement).

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Remplacer toutes les occurrences de `left: 3%; ... width: 94%` par `left: 5%; ... width: 90%` dans les styles inline des `dynamic-content` |

### Occurrences a modifier

1. **Page 1** (ligne 249) : `left: 12px; right: 12px` -> `left: 5%; right: 5%`
2. **Page 4** (ligne 391) : `left: 3%; ... width: 94%` -> `left: 5%; ... width: 90%`
3. **Pages continuation** (ligne 416) : `left: 3%; ... width: 94%` -> `left: 5%; ... width: 90%`
4. **Page 5** (ligne 484) : `left: 3%; ... width: 94%` -> `left: 5%; ... width: 90%`

### Comportement attendu

- Marges laterales plus genereuses sur toutes les pages dynamiques du PDF
- Le contenu (tableaux, options, services) est mieux centre avec plus d'espace respirable sur les cotes
- Pas d'impact sur la preview (qui utilise ses propres classes Tailwind)

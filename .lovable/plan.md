

## Reduire l'affichage du tableau produits quand il y a beaucoup de lignes

### Probleme

Quand le tableau d'investissements contient beaucoup de lignes, les lignes prennent trop de place verticalement. Le "Total investissement" se retrouve tronque entre deux pages malgre la reserve de lignes, car le contenu physique deborde du conteneur fixe.

### Solution

Reduire dynamiquement la taille de police et le padding des lignes du tableau quand on est en mode multi-page (plus de 22 lignes). Cela permet de faire tenir plus de contenu par page et d'eviter la troncature.

### Modifications

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Adapter `makeRowHTML`, `tableHeaderHTML` et le total pour utiliser des tailles reduites en multi-page |

### Details techniques

**Tailles actuelles (conservees pour les petits tableaux) :**
- Police tableau : 9px
- Padding cellules : 6px 8px
- Police en-tete : implicite (herite 9px)

**Tailles reduites pour multi-page :**
- Police tableau : 7.5px
- Padding cellules : 3px 6px
- Police en-tete : 7.5px, padding reduit a 5px 6px

La detection est simple : si `lignesData.length > INVEST_LINES_PAGE1` (22 lignes), on applique les tailles compactes. Sinon, on garde les tailles normales.

Les variables de style seront definies avant la generation du HTML :

```text
const isCompact = lignesData.length > INVEST_LINES_PAGE1;
const tableFontSize = isCompact ? '7.5px' : '9px';
const cellPadding = isCompact ? '3px 6px' : '6px 8px';
const headerPadding = isCompact ? '5px 6px' : '8px';
```

Ces variables seront injectees dans `tableHeaderHTML`, `makeRowHTML` et le bloc `totalHTML` pour garantir un affichage homogene et compact quand le nombre de lignes est eleve.


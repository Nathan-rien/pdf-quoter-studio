

## Corriger l'affichage des descriptions d'options avec retours a la ligne

### Probleme
Lors de l'import depuis l'Admin, la description est construite en joignant les services par des virgules (`, `) dans `RentalDataEditor.tsx` ligne 119. Les sous-elements (Niveau 1, Niveau 2...) utilisent deja des `\n` comme separateur interne. Mais dans l'apercu (`RentalProposalPreview.tsx`), le texte est decoupe par `.split(',')`, ce qui casse la structure hierarchique : tout apparait a la suite au lieu d'etre sur des lignes separees.

### Solution
Deux modifications :

**1. `src/components/rental-proposal/RentalDataEditor.tsx` (ligne 119)**
Remplacer le separateur virgule par un retour a la ligne lors de la concatenation des services :
```
// Avant
const description = descriptionParts.join(', ');

// Apres
const description = descriptionParts.join('\n');
```

**2. `src/components/rental-proposal/RentalProposalPreview.tsx` (6 occurrences)**
Remplacer tous les `.split(',')` sur les descriptions par un split qui gere a la fois les virgules et les retours a la ligne, en privilegiant les retours a la ligne :
```
// Avant
option.description.split(',').map(...)

// Apres
option.description.split('\n').map(...)
```

Cela concerne les lignes approximatives : 847, 871, 905, 958, 998, 1022.

Les descriptions contenant des retours a la ligne seront alors affichees correctement avec un element de liste par ligne, preservant la hierarchie (titre du service, puis sous-elements indentes).

### Impact sur l'export PDF
L'export (`RentalProposalExport.tsx`) utilise deja `white-space: pre-wrap` sur les descriptions (lignes 353, 381, 411), donc les retours a la ligne sont deja correctement rendus. Aucune modification necessaire cote export.

### Note
Les propositions deja creees avec des virgules comme separateur continueront a fonctionner si l'on utilise un split hybride. Mais puisque les nouvelles importations utiliseront `\n`, on peut utiliser `.split('\n')` et les anciennes descriptions separees par virgules apparaitront simplement sur une seule ligne (comportement acceptable car il n'y a pas de persistance long terme des donnees).

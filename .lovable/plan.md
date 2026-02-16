

## Deux corrections : nettoyage du champ Ville + pagination du tableau Investissements

### 1. Nettoyage du champ "Ville" dans le parser PDF

**Probleme** : La regex a la ligne 172 de `pdf-import-parser.ts` capture tout le texte apres le code postal. Quand le PDF contient `75013 PARIS - Ouvert du lundi au vendredi de`, la ville est extraite comme `PARIS - Ouvert du lundi au vendredi de` au lieu de juste `PARIS`.

**Solution** : Ajouter un nettoyage post-extraction dans toutes les fonctions de parsing (Cybertek, Grosbill, Dental) pour couper le texte de la ville au premier tiret (`–` ou `-`) suivi de texte non pertinent (horaires, informations d'ouverture, etc.).

**Fichier** : `src/lib/pdf-import-parser.ts`
- Ajouter une fonction utilitaire `cleanCityName(raw: string): string` qui :
  - Supprime tout texte apres un tiret long ou court suivi de mots comme "Ouvert", "du", "Lundi", "Horaires", etc.
  - Supprime les suffixes `FR` deja geres
  - Trim le resultat
- Appeler cette fonction a chaque affectation de `result.client!.ville` (lignes 175, 203, 1034, 1042, 1056, 1079, 1490)

Exemple :
```
cleanCityName("PARIS – Ouvert du lundi au vendredi de") → "PARIS"
cleanCityName("BORDEAUX") → "BORDEAUX"
cleanCityName("ST MEDARD EN JALLES FR") → "ST MEDARD EN JALLES"
```

---

### 2. Pagination du tableau "Vos investissements" sur plusieurs pages

**Probleme** : La constante `LINES_PER_PAGE = 12` dans `canvas-constants.ts` limite le tableau a 12 lignes. Les lignes supplementaires sont ignorees (`.slice(0, LINES_PER_PAGE)`). Le screenshot montre environ 10 lignes affichees mais il y en a plus dans les donnees importees.

**Solution** : Permettre au tableau de s'etendre sur des pages supplementaires quand il depasse la capacite d'une seule page.

**Fichiers modifies** :

**a) `src/lib/canvas-constants.ts`**
- Augmenter ou supprimer la contrainte `LINES_PER_PAGE` (utiliser une valeur plus elevee, ex: 50, ou ne plus limiter)

**b) `src/components/rental-proposal/RentalProposalPreview.tsx`**
- Dans `renderProductPage()` (ligne 643) : supprimer le `.slice(0, LINES_PER_PAGE)` pour afficher toutes les lignes
- Le conteneur dynamique est deja en flux relatif avec les elements "Avantages" et "Conditions" qui suivent, donc un tableau plus long poussera simplement ces elements vers le bas
- Le CSS `overflow: hidden` deja absent du conteneur principal permet au contenu de s'etendre

**c) `src/components/rental-proposal/RentalProposalExport.tsx`**
- Dans la generation du HTML (ligne 276) : supprimer le `.slice(0, LINES_PER_PAGE)` pour inclure toutes les lignes dans l'export PDF
- Le conteneur dynamique en `position: absolute` avec le flow layout deja implemente (elements "en-dessous" en flux relatif) s'adaptera naturellement

**Note importante** : Dans l'apercu, le contenu peut deborder visuellement de la "page" A4 simulee. C'est acceptable car l'apercu est un rendu web scrollable, pas un decoupage physique. L'export PDF generera le contenu sur la surface necessaire. Si dans le futur une vraie pagination multi-page est souhaitee pour l'apercu, ce sera une evolution separee.

---

### Resume des modifications

| Fichier | Modification |
|---|---|
| `src/lib/pdf-import-parser.ts` | Ajouter `cleanCityName()` + l'appliquer sur toutes les extractions de ville |
| `src/lib/canvas-constants.ts` | Optionnel : augmenter `LINES_PER_PAGE` ou le supprimer |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Retirer `.slice(0, LINES_PER_PAGE)` dans `renderProductPage()` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Retirer `.slice(0, LINES_PER_PAGE)` dans le HTML de la page 4 |


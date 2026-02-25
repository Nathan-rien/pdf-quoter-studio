

## Probleme

La page 5 (Services inclus + Nos Options) a un `maxHeight: 82%` avec `overflow: hidden`. Quand il y a beaucoup de services et d'options, le contenu est tronque sans aucun mecanisme de pagination. Le meme probleme existe dans l'export PDF.

## Approche

Implementer une pagination automatique pour le contenu services/options, identique a celle du tableau investissements :
- Mesurer le contenu total en "blocs equivalents"
- Si le contenu depasse la capacite d'une page, creer des pages de continuation automatiques
- Les pages supplementaires sont inserees apres la page 5 du template

## Constantes de dimensionnement

Ajouter dans `canvas-constants.ts` :

```
// Pagination des services/options (Page 5)
export const SERVICES_ITEMS_PAGE1 = 8;      // blocs max sur page 1 (avec titre + Services location)  
export const SERVICES_ITEMS_CONTINUATION = 12; // blocs max sur pages de continuation
```

Chaque bloc = 1 service inclus ou 1 option. Le bloc "Services location" permanent compte pour 1 bloc. Le titre "Nos options" compte pour 1 bloc.

## Modifications

### 1. `src/lib/canvas-constants.ts`
- Ajouter `SERVICES_ITEMS_PAGE1 = 8` et `SERVICES_ITEMS_CONTINUATION = 12`

### 2. `src/components/rental-proposal/RentalProposalPreview.tsx`

**Calcul des chunks services** (a cote du calcul `investChunks`) :
- Construire une liste lineaire de tous les "blocs" a afficher : [servicesLocation, ...selectedOptions, titreNosOptions?, ...selectedNosOptions]
- Decouper en chunks : premier chunk = `SERVICES_ITEMS_PAGE1`, suivants = `SERVICES_ITEMS_CONTINUATION`
- `extraServicesPages = max(0, servicesChunks.length - 1)`
- `totalPages = templatePages + extraInvestPages + extraServicesPages`

**Rendu `renderServicesInclusPage`** :
- Accepter un parametre `chunkIndex` pour savoir quelle tranche de blocs afficher
- Page 0 : titre + Services location + premiers blocs
- Pages suivantes : blocs de continuation sans le titre principal
- Retirer `maxHeight` et `overflow: hidden`

**`renderCurrentPage`** :
- Ajouter une plage de pages services apres la page 5 du template (decalee par extraInvestPages)
- Decaler les pages suivantes (6, 7, 8...) par `extraServicesPages` en plus de `extraInvestPages`

### 3. `src/components/rental-proposal/RentalProposalExport.tsx`

**`generateDynamicContentByPage`** :
- Meme logique de chunking pour le contenu HTML de la page 5
- Si multi-page : le premier chunk va dans `dynamicContent[5]`, les chunks suivants dans `extraPagesAfter[5]`
- Retirer `max-height` et `overflow: hidden` du wrapper

### Detail du chunking

```text
allBlocs = [
  { type: 'services-location' },           // toujours present
  ...selectedOptions.map(o => ({ type: 'option', data: o })),
  ...(selectedNosOptions.length > 0 ? [{ type: 'nos-options-title' }] : []),
  ...selectedNosOptions.map(o => ({ type: 'nos-option', data: o })),
]

chunk 0 : blocs[0..SERVICES_ITEMS_PAGE1-1]    (page 5 du template)
chunk 1 : blocs[PAGE1..PAGE1+CONTINUATION-1]   (page supplementaire)
chunk N : ...
```

### Impact sur la navigation

Le calcul de `totalPages` et `renderCurrentPage` gere deja les pages invest supplementaires via un systeme de decalage. Le meme pattern sera applique pour les pages services :

```text
Pages template : 1, 2, 3, [4, 4+extra_invest...], [5, 5+extra_services...], 6, 7, 8
```

La logique dans `renderCurrentPage` :
1. Pages avant investPage → rendu normal
2. Pages dans la plage invest → `renderProductPage(chunkIndex)`
3. Pages dans la plage services → `renderServicesInclusPage(chunkIndex)`
4. Pages apres → decalage par `extraInvestPages + extraServicesPages`


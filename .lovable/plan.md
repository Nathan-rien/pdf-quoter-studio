
## Pagination du tableau "Vos investissements" sur plusieurs pages

### Contexte
Quand le tableau d'investissements contient trop de lignes (ex: 30+ lignes), il deborde de la page 4 A4. Il faut decouper le tableau en morceaux et generer automatiquement des pages supplementaires, en decalant les pages suivantes (services, signature, etc.) d'autant.

### Approche
Definir un seuil de lignes par page (`INVEST_LINES_PAGE1 = 18`, `INVEST_LINES_CONTINUATION = 28`) pour determiner combien de "chunks" le tableau necessite. Si le tableau tient en une page, aucun changement. Sinon, des pages intermediaires sont inserees entre la page 4 et la page 5 actuelle.

### Detail technique

#### 1. Constante de pagination - `src/lib/canvas-constants.ts`
- Ajouter `INVEST_LINES_PAGE1 = 18` (premiere page : moins de place car titre + en-tetes)
- Ajouter `INVEST_LINES_CONTINUATION = 28` (pages suivantes : plus de place, juste le tableau)

#### 2. Apercu (Preview) - `src/components/rental-proposal/RentalProposalPreview.tsx`

**Calcul des pages supplementaires :**
- Calculer le nombre de "chunks" du tableau invest selon les seuils ci-dessus
- `extraInvestPages = max(0, nombre_de_chunks - 1)` : nombre de pages intermediaires ajoutees
- `effectiveTotalPages = totalPages + extraInvestPages`

**Ajuster `totalPages` et la navigation :**
- Utiliser `effectiveTotalPages` pour la pagination, les miniatures, et le footer "Page X/Y"
- Toute page affichee apres la page 4 est decalee de `extraInvestPages`

**Modifier `renderProductPage()` :**
- Recevoir un parametre `chunkIndex` (0 pour la premiere page, 1, 2... pour les continuations)
- Chunk 0 : affiche le titre "Vos investissements", l'en-tete du tableau, les N premieres lignes, et si c'est le dernier chunk, affiche aussi le total + propositions + elements en flux
- Chunks suivants : affiche uniquement l'en-tete du tableau + les lignes du chunk, et sur le dernier chunk, le total + propositions + elements en flux

**Modifier `renderCurrentPage()` :**
- Si `currentPreviewPage` est entre `investPage` et `investPage + extraInvestPages`, appeler `renderProductPage(chunkIndex)` avec le bon index
- Si `currentPreviewPage > investPage + extraInvestPages`, decaler le numero de page reel : `realPageNum = currentPreviewPage - extraInvestPages`

#### 3. Export PDF - `src/components/rental-proposal/RentalProposalExport.tsx`

**Modifier `generateDynamicContentByPage()` :**
- Retourner un `extraPages` (tableau de HTML de pages supplementaires) en plus de `content` et `excludeIds`
- Chunk 0 -> `dynamicContent[4]` : titre + en-tete tableau + premieres lignes (sans total/propositions si pas le dernier chunk)
- Chunks 1+ -> pages HTML completes dans `extraPages` : en-tete tableau + lignes suivantes
- Dernier chunk (quel qu'il soit) : ajoute le total, les propositions financieres, et les flow elements

**Modifier `generatePDFContentFromTemplate()` :**
- Apres la generation standard des pages, inserer les `extraPages` entre la page 4 et la page 5 dans le tableau `pagesHTML`

#### 4. Generateur HTML - `src/lib/pdf-html-generator.ts`

**Modifier `generatePDFDocumentHTML()` :**
- Accepter un nouveau parametre optionnel `extraPagesAfter?: Record<number, string[]>` qui indique des pages HTML supplementaires a inserer apres un numero de page donne
- Apres le rendu de chaque page, inserer les pages extras correspondantes
- Mettre a jour la pagination des footers (Page X/Y) pour refleter le nombre total reel

### Impact sur les pages existantes
- Pages 1-3 : inchangees
- Page 4 : contient le debut du tableau (ou tout le tableau si assez court)
- Pages 4bis, 4ter... : continuation du tableau (generees automatiquement)
- Pages 5+ : decalees dans la numerotation affichee mais utilisent toujours les elements de template de leur page originale

### Cas limite
- Si le tableau tient en 18 lignes ou moins : zero page supplementaire, comportement identique a aujourd'hui
- Si le tableau fait 19-46 lignes : 1 page supplementaire
- Si le tableau fait 47+ lignes : 2+ pages supplementaires

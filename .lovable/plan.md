
## Corriger la pagination du tableau Investissements

### Cause racine

Le probleme n'est **pas** les constantes de lignes par page. Le vrai probleme est dans la logique de chunking : la ligne `chunks.push(0)` (presente dans `RentalProposalPreview.tsx` ligne 189 et `RentalProposalExport.tsx` ligne 305) ajoute **systematiquement** une page vide dediee au footer (totaux + "Votre offre" + Avantages + Conditions), meme quand il reste de la place sur la derniere page de donnees.

Avec ~58 lignes de donnees et les constantes actuelles (28 + 38 = 66 lignes max sur 2 pages), les donnees tiennent sur 2 pages. Mais le `chunks.push(0)` force quand meme une 3e page pour le footer, d'ou la ligne orpheline qui deborde.

### Solution

1. **Ajouter une constante** `INVEST_FOOTER_RESERVED_LINES` dans `canvas-constants.ts` (environ 8 lignes reservees pour le bloc footer : totaux + proposition financiere + avantages + conditions).

2. **Modifier la logique de chunking** dans les deux fichiers pour ne creer une page footer dediee que si le dernier chunk de donnees ne laisse pas assez de place pour le footer. Sinon, garder le footer sur la meme page.

3. **Retablir des constantes realistes** : `INVEST_LINES_PAGE1 = 22`, `INVEST_LINES_CONTINUATION = 32` (les valeurs originales qui correspondent visuellement a l'espace A4 disponible).

### Detail technique

```
Logique actuelle (buguee) :
  chunks = [28, 30]  (2 pages de donnees)
  chunks.push(0)     --> [28, 30, 0]  = 3 pages (page 6 = footer seul)

Logique corrigee :
  chunks = [22, 32]  (2 pages de donnees)
  remaining_on_last_page = 32 - 30 = 2 lignes libres
  FOOTER_RESERVED = 8
  2 < 8 --> pas assez de place --> push(0)  = 3 pages

  OU avec 22 + 36 = 58 lignes max :
  chunks = [22, 36]
  remaining = 36 - 36 = 0 --> push(0) = 3 pages

  Meilleure approche : ajuster pour que le dernier chunk laisse
  de la place au footer, OU simplement ne pas forcer le chunk vide
  quand le dernier chunk a moins de (CONTINUATION - FOOTER_RESERVED) lignes.
```

La logique corrigee :
- Si le dernier chunk de donnees contient moins de `INVEST_LINES_CONTINUATION - INVEST_FOOTER_RESERVED_LINES` lignes, le footer peut tenir sur la meme page --> pas de chunk vide supplementaire.
- Sinon, ajouter le chunk vide pour une page footer dediee.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/lib/canvas-constants.ts` | Ajouter `INVEST_FOOTER_RESERVED_LINES = 8`, retablir `INVEST_LINES_PAGE1 = 22`, `INVEST_LINES_CONTINUATION = 32` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Remplacer `chunks.push(0)` par une condition basee sur l'espace restant |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme correction de la logique de chunking |

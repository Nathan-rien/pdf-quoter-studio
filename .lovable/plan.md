

## Solution definitive : footer toujours sur page dediee en multi-page

### Constat

L'approche conditionnelle ne fonctionne pas : meme avec 9 emplacements "libres" en bas de page, le footer (Total + Votre offre + propositions financieres + Avantages + Conditions) depasse visuellement car sa hauteur reelle en pixels est superieure a 9 lignes de tableau. Le probleme est structurel : estimer la hauteur du footer en "lignes equivalentes" est imprecis.

### Solution

Revenir a un `chunks.push(0)` **inconditionnel** en multi-page, combine avec le guard `pageLines.length > 0` deja en place pour eviter le header de tableau vide sur la page footer.

### Modifications

| Fichier | Changement |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` (lignes 188-193) | Supprimer la condition `if (lastChunk > limit - ...)` et remettre un simple `chunks.push(0)` |
| `src/components/rental-proposal/RentalProposalExport.tsx` (lignes 304-309) | Meme simplification |

### Code cible (identique dans les deux fichiers)

```typescript
// Apres la boucle while qui remplit les chunks :
// Multi-page : toujours reporter le footer sur une page dediee
chunks.push(0);
return chunks;
```

Les 4 lignes de condition (`lastChunk`, `limit`, `if`) sont supprimees et remplacees par un seul `chunks.push(0)`.

Le guard `pageLines.length > 0` dans le Preview (deja present) garantit qu'aucun header de tableau vide ne s'affiche sur cette page footer.

### Resultat attendu

- 45 lignes : chunks = [22, 23, 0] -> Page 4 (22 lignes), Page 5 (23 lignes de tableau uniquement), Page 6 (Total + Votre offre + Avantages + Conditions)
- 20 lignes : chunks = [20] -> tout sur une seule page, pas de multi-page
- 54 lignes : chunks = [22, 32, 0] -> 3 pages


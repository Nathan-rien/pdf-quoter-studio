

## Ajuster le seuil de reservation footer pour eviter la page vide

### Diagnostic

Avec les donnees actuelles (~45 lignes), le decoupage produit `[22, 23]`. La condition `23 >= 32 - 14 = 18` est vraie, ce qui force une page footer dediee (Page 6) alors qu'il reste 9 emplacements libres en bas de la Page 5 -- suffisamment pour le footer (1 bloc "Votre offre" + Avantages + Conditions).

Le probleme : `INVEST_FOOTER_RESERVED_LINES = 14` est trop conservateur. Le footer reel avec 1 proposition financiere occupe environ 8 lignes-equivalentes de tableau.

### Solution

Deux modifications dans les memes 3 fichiers :

| Fichier | Modification |
|---|---|
| `src/lib/canvas-constants.ts` | `INVEST_FOOTER_RESERVED_LINES` passe de `14` a `9` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Condition `>=` redevient `>` (strict) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme changement `>=` en `>` |

### Comportement attendu

Avec `INVEST_FOOTER_RESERVED_LINES = 9` et `>` (strict) :

```text
Seuil = 32 - 9 = 23

Cas actuel (23 lignes sur la derniere page) :
  23 > 23 = false --> footer reste sur la Page 5 (9 emplacements libres, suffisant)

Cas avec 24+ lignes sur la derniere page :
  24 > 23 = true --> page footer dediee (seulement 8 emplacements, trop juste)

Cas avec 1 seul chunk (<= 22 lignes) :
  Seuil = 22 - 9 = 13
  <= 13 lignes --> footer sur la meme page
  > 13 lignes --> page footer dediee
```

Cela garantit que le footer est place sur la meme page quand il y a assez d'espace, et deporte sur une page dediee quand l'espace est insuffisant.


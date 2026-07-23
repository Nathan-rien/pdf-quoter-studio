
# Correctif du fit auto sur les pages devis/contrat

## Diagnostic

Sur la page 1/3 (capture EXTENDE), la bannière "PRESTATAIRES EXTÉRIEURS" est plaquée contre le pied de page — aucun scale n'a été appliqué visuellement. Pourtant `fitPageContentBlocks` détecte bien le débordement.

Cause : dans `src/lib/service-proposal-html-generator.ts` (fonction `fitPageContentBlocks`, lignes ~50-74), la réduction n'est appliquée **qu'au dernier `.shell-block`** :

```
const last = blocks[blocks.length - 1];
last.style.transform = `scale(${factor})`;
```

Or ici, le débordement n'est pas causé par la taille intrinsèque du dernier bloc — c'est la hauteur cumulée des blocs précédents (Coordonnées + Sites + Contact opérationnel) qui pousse "Prestataires extérieurs" hors zone. Scaler uniquement le dernier bloc ne libère aucun espace au-dessus, donc le bandeau reste visuellement à la même position et le contenu du bloc final est simplement clippé par `overflow:hidden`.

## Correctif

Changer la cible du scale : appliquer `transform: scale(f)` sur **un wrapper englobant TOUS les `.shell-block` de la page**, pas sur le dernier seul. Ainsi la hauteur totale du contenu diminue proportionnellement et chaque bloc remonte, y compris le premier.

### Modifications dans `src/lib/service-proposal-html-generator.ts`

1. **Rendu** : dans `renderShellPage` et `renderCgShell`, envelopper la concaténation des `.shell-block` dans un unique `<div class="shell-scale-wrapper" data-shell-scale>...</div>` placé à l'intérieur du `.shell-content`. Ce wrapper reste en flux normal (pas de position absolute), ses enfants gardent leur `margin-bottom:6mm`.

2. **`fitPageContentBlocks`** : cibler `[data-shell-scale]` au lieu du dernier `.shell-block`. Boucle inchangée (paliers 0.95 → 0.75), même détection `scrollHeight > clientHeight` sur le `.shell-content` parent, même compensation de largeur `width: 100/f %` sur le wrapper.

3. Nettoyage : supprimer la logique qui touchait `last.style.*`.

## Pourquoi ça marche

- Un scale sur le wrapper englobant réduit **la hauteur totale** effectivement occupée par tous les blocs — le premier bloc remonte aussi, ce qui libère la place manquante en bas.
- Aucun changement de contenu, de police ou de layout dans les blocs eux-mêmes ; c'est purement visuel via `transform`.
- Le mécanisme reste idempotent (reset du transform à chaque appel), et le plancher 0.75 + `overflow:hidden` du parent garantit qu'on ne recouvre jamais le pied de page.

## Vérification

Rebuild, ouvrir la proposition EXTENDE, page 1/3 : "Prestataires extérieurs" doit s'afficher intégralement au-dessus du pied de page (au besoin visiblement rétréci d'un cran). Le pied de page reste dans sa bande de 24mm intacte. Pages 2/3 et 3/3, ainsi que les pages contrat 4-9, doivent conserver leur rendu actuel (pas de scale si pas de débordement).

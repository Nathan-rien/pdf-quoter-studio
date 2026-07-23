## Problème

L'agrandissement du logo (280×76) a fait grossir le bandeau noir et forcé le titre "CONTRAT CADRE DE PRESTATIONS DE SERVICES" sur deux lignes, tout en poussant le contenu vers le bas.

## Correctif

Dans `src/lib/service-proposal-html-generator.ts`, fonction `renderCgHeader` (ligne 708) :

1. Rendre le bandeau à hauteur fixe (identique à l'ancienne, ~17mm) via `height` explicite et `position:relative`, pour qu'il ne s'étire plus avec le logo.
2. Positionner le logo en `position:absolute` (à droite, centré verticalement) afin qu'il puisse rester grand (280×76) sans influer sur la hauteur du bandeau.
3. Réserver via `padding-right` la place du logo pour que le titre ne passe pas dessous, tout en gardant la taille de police actuelle (14px) → titre sur une seule ligne.

Aucun autre changement (padding pages, tailles de police, contenu, footer) — uniquement le bandeau et le positionnement du logo.

## Vérification

- Build OK.
- Screenshot Playwright de la page 1 pour confirmer bandeau à hauteur normale + titre sur une ligne + logo agrandi conservé.
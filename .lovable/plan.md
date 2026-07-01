## Contexte

Deux problèmes distincts :

1. **« Initialiser Contrat Cadre Services » ne fait rien de visible.** `seedContratCadreTemplate(true)` supprime bien l'ancien template et en recrée un nouveau (v1 publié, avec `service_client_info` à `top: 82, height: 14`). Mais l'éditeur est toujours ouvert sur l'**ancien** template (v15 brouillon), dont l'ID vient de disparaître. La liste des templates n'est pas rechargée et l'utilisateur reste sur une v15 orpheline → il ne voit aucun changement.

2. **Les zones dynamiques sont trop grandes.** Les hauteurs par défaut (`service_client_info: 14%`, `service_conditions: 22%`, `service_invest_table: 35%`, `service_signature: 28%`, et les fallbacks `ZONE_POSITIONS` à `40%`) rendent la boîte orange très haute dans l'éditeur. Comme le rendu (aperçu + PDF) positionne le bloc à `top` mais avec sa **propre** hauteur de contenu compacte, le résultat visuel ne colle pas avec le rectangle affiché dans l'éditeur → positionnement peu précis.

## Correctifs

### 1. Réduire la hauteur par défaut des zones dynamiques

**`src/lib/seedContratCadreTemplate.ts`** — ajuster les `position.height` pour qu'ils correspondent à la hauteur réelle du bloc rendu :
- `service_client_info` (page 1) : `top: 82, height: 10` (au lieu de 14) — le bloc client compact fait ~10% de la page A4.
- `service_conditions` (page 4) : `top: 50, height: 12` (au lieu de `top: 42, height: 22`) — 6 lignes de texte compact.
- `service_invest_table` (page 6) : `top: 10, height: 25` (au lieu de 35) — hauteur estimée pour un tableau moyen ; l'utilisateur peut agrandir si besoin.
- `service_signature` (page 6) : `top: 70, height: 15` (au lieu de `top: 62, height: 28`).

**`src/components/template-editor/EditorCanvas.tsx`** — la constante `ZONE_POSITIONS` (fallback) : abaisser la hauteur par défaut de `40%` à `12%` pour toutes les nouvelles zones ajoutées manuellement, afin que le bloc orange dans l'éditeur soit proche du rendu réel.

**`src/components/service-proposal/ServiceProposalPreview.tsx`** — dans `renderServiceDynamicZone`, les fallbacks de `topPct` restent inchangés (déjà cohérents). Aucune modification de rendu nécessaire.

### 2. Corriger « Initialiser Contrat Cadre Services »

**`src/components/template-editor/TemplateEditorLayout.tsx`** — après l'appel `await seedContratCadreTemplate(true)` :
- Recharger la liste des templates (`loadTemplates()` du store).
- Appeler `selectTemplate(<nouveauTemplateId>)` pour sélectionner explicitement la nouvelle version publiée v1.
- Afficher un toast de succès (« Template réinitialisé — v1 publiée sélectionnée »).

Cela évite que l'utilisateur reste bloqué sur une version orpheline.

### 3. (Optionnel) Auto-sélection Services

`ServiceProposalView.tsx` sélectionne déjà « Contrat Cadre Services » par nom via useRef → l'aperçu Proposition Services reprendra automatiquement le nouveau template après ré-initialisation.

## Résultat attendu

- Les rectangles orange dans l'éditeur ont désormais une hauteur proche du bloc réellement rendu → glisser une zone à `top: 82%` la place visuellement au même endroit que dans l'aperçu et le PDF exporté.
- Le bouton « Initialiser Contrat Cadre Services » recharge la liste et bascule immédiatement l'éditeur sur la nouvelle v1 publiée avec les positions corrigées.
- Aucune modification de logique métier (rendu aperçu, export PDF, données) — uniquement des dimensions par défaut et du refresh d'UI.

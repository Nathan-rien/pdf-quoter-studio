
Objectif: réafficher les “Nos Options” dans l’aperçu après la page 5, sans réintroduire les doublons ni casser l’export.

1) Corriger la résolution de la page cible “Nos Options” dans l’aperçu
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx`
- Ajouter un resolver dédié pour la page options (au lieu d’utiliser directement le premier `options_block`):
  - Lire la page retournée par `getInjectionPageForZoneType('options_block')`
  - Si cette page est `<= 5` (conflit avec la page services), basculer vers la première page existante `> 5` dans la version (fallback attendu: page 6)
  - Sinon garder la page de zone
- Remplacer l’usage actuel de `optionsPageNum` dans `renderCurrentPage()` par cette page résolue.
- Conserver le rendu dynamique existant de `renderNosOptionsPage()` (filtrage statique en images uniquement) pour éviter que le texte du template masque le bloc options.

2) Aligner l’export avec la même logique de résolution
- Fichier: `src/components/rental-proposal/RentalProposalExport.tsx`
- Appliquer le même resolver de page options avant `dynamicContent[optionsPageNum] = ...`
- Empêcher l’écrasement de la page 5 services quand la zone `options_block` est sur page 5 (cas actuel du template v124).
- Garder la séparation: page 5 = services inclus, page options dédiée = nos options.

3) Vérifier la cohérence des données affichées
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx`
- Vérifier que la liste utilisée pour la page options reste cohérente avec le comportement voulu (actuellement `nosOptions`).
- Ne pas réinjecter `selectedNosOptions` dans `servicesBlocs` (déjà corrigé).

4) Ajuster les libellés UI trompeurs (optionnel mais recommandé)
- Fichier: `src/components/rental-proposal/RentalDataEditor.tsx`
- Mettre à jour les textes “Page 5 / fusionnées sur Page 5” dans l’onglet “Nos Options” pour refléter la page dédiée options (évite confusion utilisateur).

Détails techniques constatés (cause racine)
- La version active du template (`da7a0c69...`, v124) a les zones `options_block` sur la page 5.
- Le routing preview traite déjà la page 5 comme page services; du coup le test `realPageNum === optionsPageNum` ne peut jamais afficher les options si `optionsPageNum = 5`.
- Résultat visible: on passe de la page 5 à la page 6 statique (“juste du texte”), sans bloc options.

Validation après implémentation
- Aperçu:
  - Page 5: services inclus présents, pas de nos options en double.
  - Page 6: bloc “Nos Options” visible avec prix (incluant Pro-déploiement).
- Export PDF:
  - Page services intacte.
  - Page options dédiée affichée, sans écraser la page services.
  - Cases “Nos Options” restent vides comme demandé précédemment.

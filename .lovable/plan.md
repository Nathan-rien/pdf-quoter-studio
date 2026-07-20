## Diagnostic

- Base : la version publiée du template « Contrat Cadre Services » est la **v18 (17/07/2026)**.
- Contenu de la v18 en base pour `p2p-lbl-tarifs` : `fontFamily: Inter, fontSize: 10, italic/bold`, texte casse mixte — c'est exactement ce qu'on voit dans la capture (petit label bleuté).
- Les ids `p2p-tarif-h-lbl` / `p2p-tarif-h-val` / `p2p-tarif-r*-lbl-bg` (en-tête + fonds bordés) **n'existent pas** dans la v18 : le tableau reconstruit lors du dernier tour n'a jamais été publié.
- Conclusion : le code de `seedContratCadreTemplate.ts` est correct, mais aucune republication n'a été déclenchée. L'aperçu et l'export lisent la v18 obsolète.

## Plan

1. **Republier le template en base** en appelant `seedContratCadreTemplate()` (via un script one-shot lancé dans le sandbox) pour créer une **v19 publiée** avec :
   - `p2p-lbl-tarifs` en `SECTION_TITLE_STYLE` (Outfit 11px 600 majuscules #1a1a1a)
   - `p2p-lbl-cond` idem
   - `p2p-lbl-summary` supprimé (doublon de la zone dynamique)
   - Tableau « Interventions sur site » reconstruit : ligne d'en-tête #f3f4f6 (Intervention / Tarif), bordures 1px #e5e7eb sur chaque cellule, alternance #ffffff / #f9fafb, TD_STYLE pour libellés/valeurs
2. **Vérifier la republication** :
   - `SELECT version_number, status` sur `template_versions` pour confirmer v19 publiée
   - Requête JSONB pour confirmer la présence des ids `p2p-tarif-h-lbl`, `p2p-tarif-r1-lbl-bg`, etc. et l'absence de `p2p-lbl-summary`
3. **Vérifier le rendu** dans l'aperçu du sandbox via Playwright sur une proposition Services en mode Contrat, page 2/3, et capturer un screenshot pour comparer au style du bloc « VOS MODALITÉS DE RÈGLEMENT ».
4. **Nettoyage** : marquer les anciennes versions v16/v17 en `archive` si nécessaire (v18 reste comme historique). Aucune modification de code applicatif attendue — le fix est purement une republication du seed déjà à jour.

## Détails techniques

- Script de republication : Node/tsx exécuté dans le sandbox, important `seedContratCadreTemplate` avec le client Supabase (clé service via env) — pas de modification de fichiers source.
- Aucun changement dans `service-proposal-html-generator.ts` ni dans les composants d'aperçu.
- Après validation visuelle, indiquer à l'utilisateur que la v19 est active et qu'un hard refresh peut être nécessaire côté navigateur.

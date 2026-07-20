## Problème

Sur les pages 1, 2 et 3 du template « Contrat Cadre Services », plusieurs libellés statiques font doublon avec les titres rendus par les zones dynamiques (visible sur la capture : « Bénéficiaire » petit puis « BÉNÉFICIAIRE » dans la carte, idem « Sites d'intervention », « Contact opérationnel », « Prestataires extérieurs »).

## Doublons à supprimer dans `src/lib/seedContratCadreTemplate.ts`

Page 1 (Couverture) :
- `p1c-lbl-benef` — doublon de la carte BÉNÉFICIAIRE (zone `service_client_info`)
- `p1c-lbl-sites` — doublon de SITES D'INTERVENTION (zone `service_site_addresses`)
- `p1c-lbl-op` — doublon de CONTACT OPÉRATIONNEL (zone `service_operational_contact`)
- `p1c-lbl-prest` — doublon de PRESTATAIRES EXTÉRIEURS (zone `service_external_providers`)

Page 3 (Matériel) :
- `p3m-lbl-invest` — doublon du titre rendu par `service_invest_table`
- `p3m-lbl-options` — doublon du titre rendu par `service_options`

Page 2 : déjà nettoyée (`p2p-lbl-summary` supprimé précédemment). `p2p-lbl-tarifs` et `p2p-lbl-cond` restent — pas de doublon (aucune zone dynamique ne les rend).

## Publication

Rebuild du seed et insertion d'une **Version 23** publiée dans `template_versions` pour propager les suppressions.

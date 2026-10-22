# Frais de dossier par tranche de base taux

## Vérifications effectuées
- Franfinance 1 a exactement quatre lignes sur la tranche 1 500–19 999 €, pour 24, 36, 48 et 60 mois. Son défaut partenaire est bien 118 € HT.
- Les frais et le coefficient seront résolus sur **la même ligne**, avec les mêmes bornes inclusives et la même priorité aux lignes actives.

## SQL proposé — non appliqué
Cette migration ajoute uniquement une colonne nullable à `base_taux` et initialise les quatre lignes concernées. Le contrôle bloque et annule la migration si les lignes ou durées attendues ne correspondent pas. Aucun changement sur `financial_partners`, `contracts` ou les autres tables.

```sql
ALTER TABLE public.base_taux
  ADD COLUMN IF NOT EXISTS frais_dossier numeric NULL;

DO $$
DECLARE
  franfinance_id uuid;
  matching_count integer;
  matching_durations integer[];
  updated_count integer;
BEGIN
  SELECT id INTO STRICT franfinance_id
  FROM public.financial_partners
  WHERE name = 'Franfinance 1';

  SELECT count(*), array_agg(duree_mois ORDER BY duree_mois)
  INTO matching_count, matching_durations
  FROM public.base_taux
  WHERE partner_id = franfinance_id
    AND montant_min = 1500
    AND montant_max = 19999;

  IF matching_count <> 4
     OR matching_durations IS DISTINCT FROM ARRAY[24, 36, 48, 60] THEN
    RAISE EXCEPTION
      'Franfinance 1 : attendu 4 lignes (24, 36, 48, 60 mois), trouvé % lignes, durées %',
      matching_count, matching_durations;
  END IF;

  UPDATE public.base_taux
  SET frais_dossier = 60
  WHERE partner_id = franfinance_id
    AND montant_min = 1500
    AND montant_max = 19999;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 4 THEN
    RAISE EXCEPTION 'Attendu 4 lignes mises à jour, trouvé %', updated_count;
  END IF;
END
$$;
```

La migration est rejouable : elle remet ces quatre valeurs à 60 sans créer de doublons. Les autres lignes restent inchangées ; pour une ligne sans frais propres, `NULL` signifie « frais du partenaire ».

## Changements après accord sur ce SQL
1. Appliquer exactement le SQL présenté, vérifier les quatre valeurs et le défaut partenaire inchangé à 118 €, puis actualiser les types générés.
2. Centraliser la sélection de la ligne de base taux, partagée par le coefficient et les frais. Frais renseignés sur la ligne (y compris 0) : les utiliser ; sinon reprendre le défaut partenaire.
3. Raccorder tous les lecteurs des frais : Matrice, calculs des propositions, aperçu, substitution `{{FRAIS_DOSSIER}}` et anciens libellés, export. Ne pas changer les formules de loyer ni ajouter les frais au financement.
4. Ajouter une colonne « Frais de dossier (€ HT) » éditable ligne par ligne. Une saisie vide enregistre `NULL` ; afficher le défaut partenaire en grisé. Préserver les autres champs de la ligne.
5. Import Excel : reconnaître une colonne de frais si présente, utiliser ses montants, une cellule vide signifiant `NULL`. Sans cette colonne, ne jamais envoyer de modification des frais existants ; une nouvelle ligne reste à `NULL`. Détecter aussi les changements portant uniquement sur les frais.
6. Ajouter et exécuter les tests : 60 € aux quatre durées de la première tranche, 118 € aux autres tranches, bornes inclusives, zéro explicite, défaut partenaire, cohérence avec la ligne du coefficient et conservation des frais à l’import sans colonne. Vérifier la saisie admin et le résultat dans la proposition et le PDF.

## Historique : comportement actuel et proposition distincte
**Les frais ne sont pas figés dans `proposal_state`.** Les 462 états enregistrés des propositions Location ne contiennent aucune clé `fraisDossier`.

- « Visualiser » utilise le HTML déjà enregistré : le montant original reste inchangé.
- « Charger pour modifier » restaure les données puis recalcule les frais depuis les références actuelles. Après cette évolution, une ancienne proposition Franfinance sur la première tranche affichera donc 60 € au lieu de 118 € si elle est rechargée pour modification.

**Solution proposée, non incluse dans les changements autorisés :** mémoriser les frais résolus pour chaque scénario lors des prochains exports, puis les restaurer au rechargement. Pour les anciens états sans montant mémorisé, conserver 118 € pour Franfinance 1 sur les exports antérieurs à la mise en service de cette règle, sans réécrire les lignes d’historique. Une action explicite pourrait permettre de reprendre les frais actuels lors d’une modification.

Cette protection nécessite votre accord distinct : aucune modification de l’historique ou de sa logique de restauration ne sera faite dans cette première étape.

## Détails techniques
- Schéma via l’outil de migration ; initialisation de la nouvelle colonne dans la même migration additive.
- Un résolveur commun dans les fonctions pures de partenaires évite de choisir deux tranches différentes pour les frais et le coefficient.
- Différencier `undefined` (champ absent à l’import, conserver), `null` (défaut partenaire) et `0` (frais nuls).
- Arrondir les montants avec `Math.round(x * 100) / 100`, affichage à deux décimales.
- Aucun changement de permissions, ni écriture sur `contracts` ou `financial_partners`.
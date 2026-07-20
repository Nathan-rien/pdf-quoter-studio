## 1. Total Service HT dans le résumé « Contrats Services »

Périmètre : uniquement l'UI de `ContractsView` / `ServiceContractsView` (ligne contrat dépliée `ContractRow.tsx`). Aucun changement dans le template PDF.

Dans le bloc « Services & options de la proposition » déjà présent :
- Ajouter, sous la liste des options, deux totaux côte à côte :
  - **Total mensuel HT** = somme des `price` des options sélectionnées (mode mensuel) + `priceTotal / duration` pour les options en mode « total ».
  - **Total sur la durée HT** = `Total mensuel HT × duration_months` (fallback sur `priceTotal` brut pour les lignes en mode total).
- Afficher les deux valeurs formatées `x xxx,xx €` avec libellés « /mois » et « sur la durée ».
- Si `duration_months` est absent, n'afficher que la somme brute des lignes (fallback).

Fichier touché : `src/components/contracts/ContractRow.tsx` (plus un petit helper de calcul pour rester lisible).

## 2. Module Sauvegardes dans Administration

### Vue admin
Nouvelle carte dans la page Administration (nouvel onglet « Sauvegardes » dans la nav admin existante) contenant :
- Bouton **« Créer une sauvegarde »** → déclenche l'edge function, récupère le zip, l'upload dans un bucket privé et le propose au téléchargement immédiat.
- Ligne d'info « Dernière sauvegarde réalisée le {date + heure + auteur} » (issue de la table `backups`).
- Liste des N dernières sauvegardes (date, taille, auteur) avec bouton **Télécharger** et bouton **Restaurer** (avec double confirmation textuelle « REMPLACER »).
- Zone d'upload d'un fichier `.zip` de sauvegarde locale → **Restaurer depuis un fichier**.

### Backend
Nouveau bucket privé `backups` (accès admin only via RLS Storage).

Nouvelle table `public.backups` :
- `id`, `created_at`, `created_by`, `file_path` (chemin dans le bucket), `size_bytes`, `tables_count`, `rows_count`, `label` (optionnel).
- RLS : lecture/insert/delete réservés au rôle `admin` via `public.has_role(auth.uid(),'admin')`.
- GRANT `SELECT,INSERT,DELETE` à `authenticated`, `ALL` à `service_role`.

Deux edge functions (service role) :

- **`backup-export`** :
  1. Vérifie JWT + rôle admin.
  2. Dump SELECT * de chaque table métier listée (whitelist explicite ci-dessous) en JSON.
  3. Empaquette dans un ZIP contenant `manifest.json` (version, date, liste des tables, nombre de lignes par table, hash) + un fichier `<table>.json` par table.
  4. Upload dans `backups/<yyyy-mm-dd_HHmmss>_<uuid>.zip`.
  5. Insère la ligne `backups` correspondante.
  6. Renvoie l'URL signée (téléchargement immédiat).

- **`backup-restore`** :
  1. Vérifie JWT + rôle admin.
  2. Reçoit soit `backup_id` (récupère le zip depuis le bucket), soit un upload direct (base64/signed URL).
  3. Valide `manifest.json` (version compatible, tables attendues).
  4. Dans une transaction : `TRUNCATE ... RESTART IDENTITY CASCADE` sur les tables métier dans l'ordre inverse des dépendances, puis `INSERT` des données du zip dans l'ordre des dépendances.
  5. Journalise l'opération (nouvelle ligne `backups` marquée `restored_from`).
  6. Renvoie un récapitulatif (tables/rows restaurés, erreurs éventuelles).

### Périmètre des tables (toutes les tables métier)

Ordre d'insertion (dépendances) — inverse pour la purge :
```text
pre_registered_commercials
profiles
user_roles
admin_settings
pdf_templates → template_versions
options_services
service_proposals
proposal_exports
contracts
client_service_references → ticket_usage_log
intervention_planning
gantt_projects → gantt_milestones → gantt_tasks → gantt_subtasks → gantt_dependencies
edi_import_lines
```
Exclus : `auth.*`, `storage.*` (comptes utilisateurs et fichiers binaires — la sauvegarde ne restaure ni les mots de passe ni les pièces jointes de contrats). Un avertissement clair l'indique dans l'UI et dans le `manifest.json`.

### Sécurité
- Les deux edge functions exigent `verify_jwt = true` + double contrôle `has_role(uid,'admin')` côté fonction.
- La restauration exige une confirmation textuelle admin dans l'UI (« taper REMPLACER »).
- Le bucket `backups` est privé, URLs signées à courte durée (5 min) pour le téléchargement.

### Fichiers créés / modifiés
- Migration : table `public.backups`, bucket `backups`, policies RLS (table + storage).
- Nouvelle edge function `supabase/functions/backup-export/index.ts`.
- Nouvelle edge function `supabase/functions/backup-restore/index.ts`.
- Nouveau composant `src/components/admin/BackupsView.tsx` + hook `useBackups`.
- Ajout d'un onglet « Sauvegardes » dans la navigation admin existante (là où sont déjà Statistiques, Commerciaux, etc.).
- `src/components/contracts/ContractRow.tsx` : ajout des deux totaux HT.

## Points hors périmètre (à confirmer si souhaité plus tard)
- Sauvegarde des fichiers du storage (pièces jointes de contrats, logos).
- Sauvegarde des comptes auth (impossible sans accès admin auth API — non couvert).
- Sauvegardes planifiées automatiques (cron).

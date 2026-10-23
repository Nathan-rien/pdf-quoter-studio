# Notifications interventions + historique dans la fiche contrat

## 1. Lien intervention ↔ contrat
- Nouvelle colonne `intervention_planning.contract_id` (nullable, FK `contracts`, ON DELETE SET NULL), index.
- Trigger BEFORE INSERT/UPDATE : si `reference_id` est renseigné, `contract_id` = `client_service_references.contract_id`.
- Rattrapage des lignes existantes : uniquement remplissage de la nouvelle colonne depuis `reference_id` (aucune autre donnée touchée).
- Dialogue « Nouvelle intervention » (PlanningView) : le mode « hors contrat » est conservé (interventions facturées à part, clients sans contrat de services). En mode « contrat », le choix du contrat de services devient obligatoire ; la prestation reste optionnelle. Une intervention hors contrat n'alimente aucune fiche contrat (`contract_id` vide).

## 2. Notifications
**Lien commercial_id → compte utilisateur** : `contracts.commercial_id` → `pre_registered_commercials.commercial_id` → e-mail → compte dont l'e-mail correspond (insensible à la casse) — exactement l'inverse de `get_user_commercial_id()`.

**Contrats 'quick' (ou commercial_id sans correspondance)** : uniquement une correspondance EXACTE sur le nom complet (`commercial_name` comparé au nom d'un commercial pré-enregistré ou d'un profil, insensible à la casse, espaces en trop retirés et espaces internes ramenés à un seul). Rattachement seulement si le nom contient au moins un prénom et un nom (2 mots minimum) ET que la correspondance donne un seul compte. Les noms partiels (« CYRIL », « Jonathan », « Grégory ») ne sont jamais rattachés.

**Repli admins** : si aucun compte unique n'est trouvé → tous les admins, titre préfixé « commercial non identifié ». Intervention hors contrat → tous les admins, titre préfixé « hors contrat ».

- Table `notifications` (id, user_id, type, title, message, link, is_read, created_at, + contract_id/intervention_id pour le lien). RLS : SELECT et UPDATE limités à `user_id = auth.uid()` ; aucun INSERT/DELETE depuis le navigateur ; un trigger empêche de modifier autre chose que `is_read`.
- Point d'entrée unique : fonction `public.create_notification(user_id, type, title, message, link, ...)` (security definer, non exécutable par les utilisateurs). C'est là qu'un envoi e-mail Resend pourra être branché plus tard ; rien n'est branché maintenant.
- Fonction `resolve_contract_commercial_user(contract_id)` + trigger AFTER INSERT/UPDATE sur `intervention_planning` :
  - création → « Intervention planifiée »
  - date modifiée → « Intervention replanifiée » (ancienne → nouvelle date)
  - statut passé à `annulee` → « Intervention annulée »
  - message : client, prestation, technicien, date ; lien vers le contrat.
- Cloche de l'en-tête : affichée pour tous les rôles concernés ; nouvelles notifications en base (badge non-lues, liste, « tout marquer lu » persistant). Clic → ouvre Contrats Services avec le contrat déplié. Les notifications admin actuelles (nouvelles propositions) restent dans la même liste pour les admins.

## 3. Historique dans la fiche contrat de services
- Section « Interventions » dans la fiche (ContractRow, contrats services) : date, technicien, prestation, durée, statut, commentaire, tri décroissant. Visible pour admin, technicien et le commercial du contrat (droits de lecture ajustés en conséquence).
- Bouton « Récap interventions » : choix de période (du/au), export PDF via le moteur d'export PDF existant de l'appli (`html-to-pdf`) : en-tête client + n° contrat, tableau, total des heures par statut ; et export CSV (séparateur `;`, UTF-8).

## 4. Tests
- Résolution du destinataire (fonction pure miroir + vérification SQL) : commercial avec compte ; commercial sans compte → admins ; `quick` avec nom complet exact et unique → commercial ; `quick` avec nom partiel (« CYRIL ») → admins ; `quick` avec nom en double → admins ; intervention hors contrat → admins « hors contrat ».
- Lien contrat depuis la prestation.
- Droits : un utilisateur ne voit/ne marque que ses notifications, ne peut pas en créer.
- Totaux d'heures par statut et contenu CSV du récap.

## 5. Ordre de travail
1. Lister les 14 contrats `quick` et vérifier lesquels ont une correspondance exacte et unique sur le nom complet.
2. Vous montrer le SQL complet ; application seulement après votre accord.
3. Code, tests, récap final (fichiers modifiés + contrats `quick` sans commercial notifiable).

## Détails techniques
- Migration idempotente : `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` / `DROP POLICY IF EXISTS` avant recréation ; GRANT `SELECT, UPDATE` à authenticated, ALL à service_role.
- Policy SELECT supplémentaire sur `intervention_planning` pour le commercial via `can_access_contract` sur le contrat lié.
- Fichiers prévus : PlanningView.tsx, ContractRow.tsx, nouveau `InterventionsHistory.tsx` + `interventions-recap.ts`, nouveau `useNotifications.ts`, AdminNotificationBell.tsx, Index.tsx, ServiceContractsView.tsx (ouverture ciblée), tests.

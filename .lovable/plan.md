# Rôle Technicien : accès limité à « Services & interventions »

Objectif : un utilisateur avec le rôle `technicien` accède aux Contrats de services **uniquement pour agir sur l'encart « Services & interventions »** (Réf. JAJA, tickets, historique, planification, ajout de service). Tout le reste du contrat est en lecture seule, et les parties Location / Propositions Services lui sont invisibles.

## Ce que verra un technicien

Menu latéral (technicien non-admin) :
- Contrats Services (nouveau pour ce rôle)
- Suivi Techniciens
- Planning Services

Rien d'autre : pas de Location (Proposition, Contrats, Historique), pas de Prop. Services, pas d'Historique Services, pas d'Administration.

Dans la vue Contrats Services :
- il consulte la liste des contrats de services (recherche, tri, détail dépliable) ;
- l'encart « Services & interventions » est **pleinement actif** : éditer la Réf. JAJA, consommer un ticket, voir l'historique, Planifier, Tout planifier, Ajouter un service ;
- tous les autres champs (nom client, commercial, durée, dates, partenaire, cession, montants, numéro de contrat, Réf. Jaja du contrat, prestataires extérieurs, pièces jointes, suppression, création de contrat) s'affichent en **lecture seule** : pas de champs de saisie, pas de boutons Enregistrer/Supprimer/Nouveau contrat ;
- la modification des tickets initiaux/restants reste réservée aux admins (comme aujourd'hui) ; le technicien édite la Réf. JAJA et consomme les tickets.

## Détails techniques

Base de données (une migration) :
- `contracts` : ajouter la lecture pour les techniciens (`has_role(auth.uid(),'technicien')`) dans la policy SELECT — aujourd'hui un technicien ne voit aucun contrat.
- `client_service_references` : autoriser INSERT et UPDATE aux techniciens en plus des admins (aujourd'hui admin uniquement, donc « Planifier »/édition JAJA/ajout de service échouent pour un technicien). DELETE reste admin. La consommation de ticket passe déjà par `consume_ticket` qui accepte le technicien.
- Aucune ouverture sur `service_proposals`, `proposal_exports`, `options_services` : le technicien reste sans accès aux propositions.

Front :
- `AppSidebar.tsx` : afficher « Contrats Services » aussi quand `isTechnicien`, en gardant Prop. Services / Historique Services réservés aux admins.
- `Index.tsx` : la route `service-contracts` devient accessible `isAdmin || isTechnicien` ; l'atterrissage par défaut du technicien reste Suivi Techniciens ; `onCreateManual` n'est pas passé pour un technicien.
- `ServiceContractsView.tsx` : nouveau mode lecture seule (masquer « Nouveau contrat », filtres conservés) piloté par un prop `canEditContract`.
- `ContractRow.tsx` : introduire `canEditContract` (dérivé de `useAuth`, `isAdmin`) et, quand il est faux, rendre les champs contrat en texte simple (masquer Select/Input/Enregistrer/Supprimer/upload), tout en continuant à afficher `ServiceReferencesPanel` avec ses actions actives.
- `ServiceReferencesPanel.tsx` : inchangé côté logique, `isAdmin` continuant de gouverner l'édition des quotas.

Aucune modification des contrats Location ni des propositions.

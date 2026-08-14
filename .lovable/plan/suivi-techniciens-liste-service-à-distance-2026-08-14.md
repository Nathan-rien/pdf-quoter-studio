# Suivi Techniciens — Liste « Service à distance »

Remplacer entièrement le contenu de l'onglet Suivi Techniciens par un tableau reprenant le format du fichier CSV / de la liste SharePoint, avec saisie manuelle, import CSV et gestion des tickets.

## Ce qui change

L'écran actuel (cartes par contrat avec services, JAJA et planification) est remplacé par un tableau unique « Clients \ Service à distance ».
Le panneau services & interventions reste disponible dans les Contrats Services (inchangé), tout comme le Planning Services.

## Colonnes du tableau

BU · Commercial(e) · Entité · N°Clt · N° Cmd · N° Fact. · Forfait · Nbre. Tickets · Attribution · Nbre Machine(s) · Liste Produit(s)\SN · Début · Fin · Payé ?

Rendu proche de la capture :
- BU en badge coloré (CYBERTEK / GROSBILL), Commercial(e) et Attribution (Parc / Unité(s)) en badges légers, Forfait en badge coloré tronqué avec libellé complet au survol.
- Liste Produit(s)\SN sur plusieurs lignes, texte compact, colonne repliable si trop longue.
- Dates au format JJ/MM/AAAA, « Payé ? » en badge Oui/Non.
- En-tête avec recherche libre (entité, commercial, forfait, n° client) et filtres BU / Payé, tri par date de fin.

## Tickets

Chaque ligne porte :
- un libellé texte des tickets (ex. « 39 x ARTSIDE GAME BASE ») repris du fichier ;
- un compteur : tickets initiaux et tickets restants.

Actions sur une ligne : « Consommer un ticket » (décompte de 1, refus si quota épuisé), ajustement du quota initial, et historique des consommations (qui, quand, note).

## Saisie et import

- Bouton « Nouvelle ligne » : formulaire avec tous les champs ci-dessus.
- Édition et suppression d'une ligne.
- Bouton « Importer un CSV » : dépôt du fichier au même format que celui fourni (mêmes en-têtes), aperçu du nombre de lignes, puis insertion. Les lignes existantes sont reconnues via N° Fact. + Entité pour éviter les doublons.
- Les 10 lignes du fichier fourni sont chargées à la mise en place.

## Détails techniques

- Nouvelle table `remote_support_clients` : bu, commercial_name, entity, client_number, order_number, invoice_number, forfait, tickets_label, tickets_initial, tickets_remaining, attribution, machines_count, products_sn, start_date, end_date, is_paid, created_at/updated_at (+ trigger updated_at).
- Table `remote_support_ticket_log` : ligne concernée, date, utilisateur, note.
- Accès : lecture pour tout utilisateur connecté ; création/modification/suppression pour admin et technicien ; consommation de ticket via une fonction serveur sécurisée (décrément atomique + écriture du journal), sur le modèle de la consommation existante. GRANTs explicites sur les deux tables.
- Nouveau composant `RemoteSupportView.tsx` (tableau, filtres, dialogues d'ajout/édition, consommation, import CSV) monté à la place de `TechnicianTrackingView` dans la navigation Suivi Techniciens.
- Parsing CSV côté client (gestion des champs multi-lignes et guillemets), dates au format M/J/AAAA converties en date, « Vrai/False » converti en booléen.
- `TechnicianTrackingView.tsx` n'est plus utilisé par la navigation et est supprimé ; `ServiceReferencesPanel` et `PlanningView` restent inchangés.

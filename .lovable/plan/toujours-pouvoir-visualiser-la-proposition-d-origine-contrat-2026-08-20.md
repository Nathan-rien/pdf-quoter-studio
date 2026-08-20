# Toujours pouvoir visualiser la proposition d'origine (Contrats Location)

## Constat

Dans `ContractRow.tsx`, les boutons œil et téléchargement des contrats de location suivent une logique exclusive :
si un PDF signé a été joint au contrat (`attachment_url`), ils ouvrent/téléchargent ce PDF joint,
et la proposition générée (`proposal_id` → `pdf_html_content`) n'est plus accessible du tout.

## Ce qu'on change

Séparer les deux documents au lieu de les faire s'exclure, pour les contrats de location non rapides :

- Un bouton "Visualiser la proposition" (icône document) toujours affiché dès que le contrat est issu d'une proposition (`proposal_id` présent), quel que soit le PDF joint.
- Les boutons œil/téléchargement existants restent dédiés au contrat joint (PDF signé) quand il existe ; sans PDF joint, ils continuent d'ouvrir la proposition comme aujourd'hui.
- Infobulles explicites : "Visualiser la proposition générée" / "Visualiser le contrat signé", pour lever l'ambiguïté.
- Bouton désactivé avec message clair si le contenu de la proposition n'est plus disponible.

Aucun changement sur les contrats de services, les contrats rapides, ni sur la logique métier ou la base de données.

## Détails techniques

Fichier : `src/components/contracts/ContractRow.tsx`

- Ajouter `handlePreviewProposal()` sur le modèle de `handleDownloadProposal()` : lecture de `proposal_exports.pdf_html_content` via `contract.proposal_id`, ouverture dans un nouvel onglet sans déclencher `print()`.
- Ajouter dans la barre d'actions (branche non-rapide, non-service) un bouton `FileText` conditionné à `contract.proposal_id`, avec état de chargement (`Loader2`).
- Conserver `onVisualize?.(contract)` comme comportement existant lorsqu'aucun PDF n'est joint.

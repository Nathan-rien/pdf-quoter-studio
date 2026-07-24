## Problème

À la validation d'une proposition Services, `generateAndUploadServiceContractPdf` produit bien le PDF **contrat** (mode `'contrat'`) et le stocke dans `contract-attachments`, puis renseigne `attachment_url` / `attachment_name` sur le contrat.

Mais dans `ContractRow.tsx`, pour un contrat "normal" (non rapide) :
- Le bouton **œil** appelle `onVisualize(contract)` → ouvre l'aperçu **devis** de la proposition.
- Le bouton **télécharger** appelle `handleDownloadProposal()` qui va chercher `proposal_exports.pdf_html_content` → c'est le HTML du **devis**, pas le contrat.

Le PDF contrat déjà généré et attaché (`attachment_url`) est ignoré. Résultat : on télécharge le devis au lieu du contrat.

## Correctif

Dans `src/components/contracts/ContractRow.tsx`, pour les contrats non rapides :

1. **Priorité au PDF contrat attaché** : si `contract.attachment_url` existe, les boutons œil et téléchargement utilisent `handleDownloadAttachment()` (signed URL du bucket `contract-attachments`) au lieu du flux devis.
2. **Fallback inchangé** : si `attachment_url` est absent (ancien contrat, génération échouée), on retombe sur le comportement actuel (aperçu / impression du HTML devis via `proposal_exports.pdf_html_content`).
3. **Titres des boutons** mis à jour dynamiquement : "Visualiser le contrat" / "Télécharger le contrat" quand le PDF contrat est présent, sinon "Visualiser la proposition" / "Télécharger la proposition".

Aucune modification de `service-contract-generator.ts`, `ValidateProposalButton.tsx`, ni du schéma DB.

## Portée

- Fichier touché : `src/components/contracts/ContractRow.tsx` uniquement.
- Affecte à la fois la vue Contrats Location et Contrats Services (même composant de ligne).
- Pour la vue Location, `attachment_url` n'est en général pas rempli automatiquement, donc le comportement reste inchangé.

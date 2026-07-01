## Objectif
Enrichir la page **Contrats Location** avec édition avancée, filtres, pièces jointes et téléchargement de la proposition liée.

---

## 1. Migration base de données (`contracts`)
Ajouter les colonnes suivantes :
- `contract_number` (text, nullable) — numéro de contrat libre
- `monthly_rent_ht` (numeric, nullable) — loyer mensuel HT (initialisé depuis `amount_ht` pour les contrats existants ; éditable indépendamment)
- `attachment_url` (text, nullable) — chemin du PDF importé
- `attachment_name` (text, nullable) — nom d'origine du fichier

Créer un **bucket Storage** `contract-attachments` (privé) + policies RLS : chaque utilisateur authentifié peut uploader/lire les fichiers du dossier `contracts/<contract_id>/…`.

Le champ `commercial_id` / `commercial_name` existe déjà — pas de migration nécessaire pour le point 1.

---

## 2. Édition du commercial (point 1)
Dans `ContractRow.tsx` (panneau déplié) :
- Ajouter un `Select` **Commercial en charge** peuplé via `useCommerciaux()` (tous les commerciaux actifs, tri alphabétique).
- Sauvegarde via `useUpdateContract` (ajouter `commercial_id` + `commercial_name` dans le payload autorisé).
- Après sauvegarde : `invalidateQueries(['contracts'])` — le contrat migre automatiquement vers le nouveau groupe commercial dans `ContractsView`.

Mettre à jour `useUpdateContract` (hook `useContracts.ts`) pour accepter les nouveaux champs : `commercial_id`, `commercial_name`, `contract_number`, `monthly_rent_ht`, `attachment_url`, `attachment_name`.

---

## 3. Filtres en haut de page (point 2)
Dans `ContractsView.tsx`, ajouter une barre de filtres au-dessus des groupes :
- **Enseigne** (Select) : Toutes / Cybertek Pro / Grosbill Pro — dérivée via `useCommerciaux().getCommercialById(contract.commercial_id)?.entity`.
- **Partenaire financier** (Select) : Tous + liste distincte des `financial_partner` présents dans les contrats.
- **Commercial** (Select) : Tous + liste des commerciaux ayant au moins un contrat.

Filtres combinables (AND). Le comptage (`Badge`) et le `groupByCommercial` s'appliquent sur la liste filtrée. Reset via bouton "Réinitialiser" quand au moins un filtre est actif.

---

## 4. Loyer mensualité (point 3)
Dans le panneau déplié de `ContractRow.tsx` :
- Ajouter un champ **Loyer mensuel HT** (`Input type="number"`) initialisé avec `contract.monthly_rent_ht ?? contract.amount_ht`.
- Sauvegardé via `useUpdateContract`.
- Affichage collapsed : remplacer `displayedAmount` (basé sur `amount_ht`) par `monthly_rent_ht ?? amount_ht`, avec la conversion trimestrielle existante (`calculateLoyerTrimestriel`).
- Le champ **Numéro de contrat** (point 6) est ajouté à côté, même grid.

---

## 5. Téléchargement de la proposition (point 4)
Ajouter dans la ligne de contrat un bouton **Télécharger** (icône `Download`) à côté de "Visualiser" :
- Fetch `proposal_exports.pdf_html_content` par `contract.proposal_id`.
- Ouvre le HTML dans une nouvelle fenêtre puis déclenche `window.print()` (même mécanisme que l'export PDF actuel du projet — conforme à la contrainte `pdf-generation-print-constraint`).
- Nom de fenêtre construit depuis `client_name + template_name` (aligné avec `proposal-export-filename-logic`).
- Toast d'erreur si `pdf_html_content` est absent (contrats créés manuellement).

---

## 6. Import d'un fichier PDF (point 5)
Dans le panneau déplié :
- Bouton **Importer PDF** avec `<input type="file" accept="application/pdf">` (limite 20 Mo côté client).
- Upload vers `contract-attachments/contracts/<contract.id>/<timestamp>-<sanitized_name>.pdf`.
- Sauvegarde `attachment_url` (chemin storage) + `attachment_name` via `useUpdateContract`.
- Si un fichier existe déjà : afficher son nom + bouton **Télécharger** (URL signée 60 s) + bouton **Remplacer** + bouton **Supprimer** (supprime aussi le fichier du bucket).
- Validation MIME + extension `.pdf` côté client, toast en cas de rejet.

---

## 7. Numéro de contrat (point 6)
Champ **Numéro de contrat** (`Input` texte) dans le panneau déplié, sauvegardé via `useUpdateContract`.
Affiché en ligne collapsed sous forme de petite chip grise `#N°XXXX` à côté du nom client quand renseigné.

---

## Impact typages
- `useContracts.ts` : étendre l'interface `Contract` avec les nouveaux champs (`contract_number`, `monthly_rent_ht`, `attachment_url`, `attachment_name`) et la signature de `useUpdateContract`.
- `src/types/contracts.ts` : mêmes ajouts pour rester aligné.

## Portée non concernée
- Les Contrats Services ne sont pas modifiés (seule la vue Location est visée par la demande).
- Pas de changement sur la génération de proposition initiale, l'historique, ou l'éditeur de template.

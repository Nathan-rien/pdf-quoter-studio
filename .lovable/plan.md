## Problème

Lors de l'ajout d'un nouveau commercial dans **Gestion des accès** (ex: Cyril Michaud / `cm-cybertek`), il n'apparaît pas dans le sélecteur « Commercial » de l'étape **Données → Commercial associé**.

## Cause

- La table DB `pre_registered_commercials` ne stocke pas l'entité (cybertek-pro / grosbill-pro) ni l'adresse — uniquement `commercial_id`, `email`, `full_name`, `telephone`.
- À l'insertion d'un nouveau profil, le champ "Entité" saisi dans le formulaire est ignoré (non envoyé en base).
- Le hook `useCommerciaux` fusionne uniquement les téléphones DB par-dessus la **liste statique** `COMMERCIAUX` (`src/data/commerciaux.ts`). Tout commercial créé en DB qui n'existe pas dans la liste statique est invisible côté dropdown.

## Plan

### 1. Base de données
Migration sur `pre_registered_commercials` :
- Ajouter colonne `entity text` (valeurs attendues : `cybertek-pro` | `grosbill-pro`).
- Ajouter colonne `adresse text` (optionnelle, pour l'aperçu dans l'étape Données).

### 2. Insertion (`AccessManagement.tsx`)
- Envoyer `entity` (et adresse par défaut de l'entité si applicable) dans le `INSERT` de `handleSaveNewProfile`.
- Rendre le champ "Entité" obligatoire pour un nouveau profil non issu de la liste statique.
- Afficher l'entité réelle (DB) pour les profils non présents dans `COMMERCIAUX` dans le tableau « Commerciaux pré-autorisés ».

### 3. Fusion runtime (`useCommerciaux.ts` + `commercials-runtime.ts`)
- Étendre la requête pour récupérer `entity`, `full_name`, `email`, `adresse`.
- Construire la liste fusionnée :
  - Pour chaque entrée statique : surcharger téléphone (comme aujourd'hui).
  - Pour chaque entrée DB **absente** de la liste statique ET ayant une `entity` valide : ajouter un objet `Commercial` synthétique (`id`, `entity`, `nom = full_name`, `email`, `telephone`, `adresse`).
- `setCommercialOverrides` doit aussi enregistrer ces commerciaux dynamiques pour que `getSelectedCommercial` (store) les retrouve via `getCommercialByIdRuntime`.

### 4. Backfill
- Le seul cas existant (Cyril Michaud) sera corrigé soit :
  - automatiquement via un `UPDATE` dans la migration si on connaît l'entité (`cm-cybertek` → `cybertek-pro`), 
  - soit en demandant à l'admin de ré-éditer (à éviter).
- Inclure un `UPDATE pre_registered_commercials SET entity = 'cybertek-pro' WHERE commercial_id LIKE '%-cybertek' AND entity IS NULL;` et équivalent pour `-grosbill`.

## Hors périmètre

- Pas de refonte de la liste statique `COMMERCIAUX` (reste comme source initiale).
- Pas d'édition d'entité depuis le tableau pré-autorisés dans cette itération (peut être ajouté ensuite si besoin).

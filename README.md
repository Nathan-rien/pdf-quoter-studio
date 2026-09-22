# Quote Builder Pro

Vous devez concevoir l’architecture fonctionnelle d’un outil production de génération de devis PDF conforme à un template, alimenté par un fichier Excel multi-onglets et des imports CSV de prix.

A) Pages / vues (liste exhaustive)

Accueil / Tableau de bord

Accès aux actions : nouveau devis, reprendre un devis, historique des exports.

Gestion des templates

Gestion du template PDF de devis (sélection/activation du template).

Import Excel (Matrice)

Chargement d’un fichier Excel.

Contrôle de présence des onglets attendus (sans les renommer).

Validation “Invest” (pré-injection)

Espace dédié à la validation du tableau qui sera injecté dans le devis (source : onglet invest ).

Import CSV prix (mise à jour quotidienne)

Chargement d’un CSV de prix.

Suivi de la date/heure du dernier import et de son statut.

Configuration des options

Sélection d’options issues de l’onglet Options services pour inclusion dans le devis.

Aperçu devis

Aperçu du rendu final (structure conforme au template).

Export

Export du devis final en PDF.

Administration (optionnel, si nécessaire)

Gestion des accès / rôles, audit des imports et exports.

B) Modules fonctionnels (sans UI détaillée)

Module Template Devis

Stockage et sélection du template PDF actif.

Mapping des zones “injectables” (ex : pages 4/5 tableau, page 6 options) au niveau conceptuel.

Module Import Excel

Ingestion du fichier Excel.

Validation structurelle (onglets requis, cohérence générale).

Module Validation Invest

Présentation d’un état “prêt à injecter” / “à corriger” du contenu issu de invest .

Module Import CSV Tarifs

Ingestion d’un CSV quotidien destiné à la mise à jour des tarifs.

Journalisation des imports (succès/erreur).

Module Options Services

Lecture des options depuis Options services .

Sélection/désélection pour inclusion dans le devis.

Module Génération Devis

Assemblage des informations : template + tableau Invest + options sélectionnées.

Module Export PDF

Génération du PDF final exportable.

Module Audit & Traçabilité

Historique des imports (Excel/CSV), validations, exports, erreurs bloquantes.

C) Flux entre modules (séquence nominale)

Sélection du template (Template Devis)

Import Excel (Import Excel)

Contrôle structure Excel → si OK : continuer ; sinon : bloquer

Validation Invest (Validation Invest) → si validé : continuer ; sinon : bloquer

Import CSV prix (Import CSV Tarifs) → optionnel selon besoin, mais traçable et bloquant si requis par le devis

Sélection options (Options Services)

Génération & aperçu (Génération Devis)

Export PDF (Export PDF)

Archivage & audit (Audit & Traçabilité)

D) Inclus (scope)

Gestion d’un template PDF de devis (structure fixe à respecter).

Import d’un fichier Excel “matrice” multi-onglets.

Écran/étape dédiée à la validation du contenu “Invest” avant injection.

Import CSV quotidien pour mise à jour des prix.

Sélection d’options depuis l’onglet “Options services” pour injection dans la page dédiée du devis.

Génération + export PDF final.

Traçabilité minimale : statut des imports/exports + erreurs.

E) Exclu (scope)

Toute fonctionnalité non demandée : CRM, signature, paiement, emailing automatique, génération de documents alternatifs.

Toute “interprétation intelligente” des données (renommage de colonnes/onglets, auto-correction silencieuse).

Toute donnée fictive en cas d’onglet/CSV manquant ou vide.

Toute logique métier non explicitement définie (calculs, arrondis, regroupements, règles de remises, etc.).

F) Rappels contractuels (à respecter partout)

Aucun renommage implicite (onglets/colonnes).

Aucune donnée mock.

Conformité stricte à la structure du template PDF.

Si ambigu / incomplet : bloquer et demander correction explicite.

Risques si cette étape est mal définie

Ajout de pages “inventées” (filtres, pagination, écrans non demandés).

Déplacement de règles métier dans l’UI faute de périmètre clair.

Import CSV traité comme “optionnel” alors qu’il doit être traçable et contrôlé.

Injection PDF non maîtrisée (zones non définies, pages modifiées).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pdf-quoter-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea1ab12e-7458-4df7-91e7-e201e653b3b2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

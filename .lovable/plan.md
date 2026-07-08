## Objectif

Harmoniser l'affichage des contrats du parcours **Location** pour que contrats manuels (issus d'une proposition) et **contrats rapides** présentent les mêmes informations, tant dans la ligne repliée que dans le panneau déplié.

Fichier touché : `src/components/contracts/ContractRow.tsx` uniquement (aucune logique backend modifiée).

## Ligne repliée

1. **Boutons Visualiser (œil) et Télécharger la proposition**
   - Les afficher aussi pour les contrats rapides.
   - Comportement :
     - Si un **PDF joint** existe (`contract.attachment_url`) → l'œil ouvre l'aperçu du PDF joint (nouvel onglet via URL signée), le bouton télécharger déclenche le téléchargement du PDF joint.
     - Sinon → boutons visibles mais **désactivés** (grisés) avec un `title` explicite ("Aucune proposition ni PDF joint").
   - Pour les contrats normaux (`proposal_id` présent), comportement inchangé.

2. **Nom du template / libellé sous la ligne**
   - Pour les contrats rapides, afficher sous la ligne le libellé `Contrat rapide` (au même emplacement que `contract.template_name` pour les contrats normaux), afin de conserver la même hauteur/structure visuelle.
   - Le badge "CONTRAT RAPIDE" à droite est **conservé** (l'utilisateur ne l'a pas coché à retirer).

## Panneau déplié

3. **Champs identiques**
   - **Client** : le champ éditable "Client" (aujourd'hui affiché uniquement pour les rapides) devient visible pour les deux, éditable dans les deux cas (les contrats normaux pourront eux aussi renommer le client — cohérent avec la persistance déjà présente dans `handleSave`, où l'on remplacera `isQuick ? clientName : contract.client_name` par `clientName` systématiquement).
   - **Commercial en charge** : garder le `Select` (liste des commerciaux) pour les deux types. Pour les rapides, pré-sélectionner `quick` si aucun commercial n'est associé, tout en gardant un champ texte libre "Autre" en secours. → Simplification : on garde le `Select` pour les deux ; pour les rapides on ajoute une entrée "Contrat rapide" en tête de liste pour rester rétro-compatible.
   - **Loyers HT** : afficher les **deux inputs** (mensuel + trimestriel) éditables pour les deux types quand la proposition ne fournit pas de loyer. Quand une proposition fournit un loyer (contrat normal validé), on garde la vue lecture seule actuelle avec les deux montants et la badge "Sélectionnée".
   - **Partenaire financier** : passer les contrats rapides sur le même `Select` que les contrats normaux (liste `FINANCIAL_PARTNERS`), au lieu du champ texte libre.
   - **Durée** : passer les contrats rapides sur la même combinaison `Select DURATIONS + Input "Autre"` que les normaux.
   - **Périodicité, Cession, Pièce jointe** : déjà identiques, aucun changement.

4. **Sauvegarde (`handleSave`)**
   - Retirer les branches `isQuick ? … : contract.<x>` sur `client_name`, `financial_partner`, `commercial_name` : envoyer systématiquement les valeurs saisies dans le formulaire.
   - `commercial_id` : garder `'quick'` par défaut pour les rapides si aucun commercial choisi.
   - `quarterly_rent_ht` : persister `manualQuarterlyValue` pour les deux types (aujourd'hui limité aux rapides).

## Détails techniques

- Pas de changement de schéma DB, ni de hooks, ni de la vue parente.
- Les propriétés `is_quick_contract`, badges et logique de tri restent inchangées ; seule l'UI de la ligne s'aligne.
- `useContractProposalRent` reste appelé uniquement pour les contrats non rapides (inchangé).
- Boutons œil/téléchargement pour les rapides utilisent `handleDownloadAttachment` (déjà présent) au lieu de `handleDownloadProposal`.

## Hors périmètre

- Suppression du badge "CONTRAT RAPIDE" (non demandé).
- Modifications côté `ServiceContractsView` (parcours Services) — la demande vise le parcours Location.

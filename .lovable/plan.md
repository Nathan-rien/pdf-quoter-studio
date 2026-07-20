## Diagnostic

Les données ne sont pas perdues en base — je les ai vérifiées : `commercial_id`, `financial_partner` et `cession_percent` sont bien stockés (ex. BDL 4 : `commercial_id='quick'`, `financial_partner='Lixxbail'`, `cession_percent=2`). Le header du contrat les affiche d'ailleurs correctement.

Le problème est côté formulaire déplié : les composants `Select` de `ContractRow.tsx` n'acceptent que des valeurs présentes dans leur liste d'options. Depuis les récentes normalisations, les listes affichées sont trop restrictives :

- **Commercial en charge** : `commercial_id='quick'` (contrats rapides) n'existe pas dans la liste `useCommerciaux` → Select vide.
- **Partenaire financier** : la constante `FINANCIAL_PARTNERS` ne contient que les libellés « canoniques » (`Lixxbail 1`, `Grenke 1`, `BNP Crédit Bail 1`…). Les valeurs héritées présentes en base — `Lixxbail`, `LIXXBAIL`, `Grenke`, `Olinn`, `BNP Credit Bail 1` — ne matchent aucun `SelectItem` → Select vide (alors que le header, lui, affiche le texte brut).
- **Cession** : la valeur est bien restaurée dans les boutons (le screenshot le confirme : « 2 % » est actif). Aucun correctif nécessaire, je le mentionne pour rassurer.

Distribution constatée en base :
```
Lixxbail 1        9    Grenke 1        8
Lixxbail          5    Grenke          4
LIXXBAIL          2    Olinn           3
BNP Credit Bail 1 2
```

## Correctifs (UI-only, aucune migration destructive)

Fichier : `src/components/contracts/ContractRow.tsx`

1. **Partenaire financier — tolérer les valeurs héritées**
   - Construire dynamiquement la liste des options du Select = `FINANCIAL_PARTNERS` ∪ `{ contract.financial_partner }` (si non vide et absent de la liste).
   - Ainsi la valeur actuelle reste sélectionnée et visible ; l'utilisateur peut la conserver ou la remplacer par un libellé canonique.
   - Option cosmétique : préfixer les entrées héritées d'un badge « (existant) » dans la liste déroulante.

2. **Commercial en charge — gérer les contrats rapides et les ID inconnus**
   - Même logique : si `contract.commercial_id` n'est pas dans `commerciaux`, ajouter une option supplémentaire au Select avec pour libellé `contract.commercial_name ?? contract.commercial_id`.
   - Pour les contrats rapides (`commercial_id='quick'`), afficher « Contrat rapide — {commercial_name} » afin de rester lisible et éditable.

3. **Rien à changer** pour Cession, Loyers HT, Date de mise en place, Durée, Périodicité, Numéro de contrat : ces champs affichent déjà correctement les données stockées.

## Portée

- Vue Contrats Location **et** Contrats Services : les deux utilisent `ContractRow.tsx`, donc un seul fichier à modifier.
- Aucune migration SQL, aucun changement de schéma, aucun impact sur la logique métier ou les calculs.
- Aucune donnée n'est réécrite automatiquement — les valeurs héritées restent telles quelles jusqu'à ce que l'utilisateur les modifie manuellement.

## Détails techniques

```ts
const partnerOptions = contract.financial_partner && !FINANCIAL_PARTNERS.includes(contract.financial_partner)
  ? [...FINANCIAL_PARTNERS, contract.financial_partner]
  : FINANCIAL_PARTNERS;

const commercialOptions = sortedCommerciaux.some(c => c.id === commercialId) || !commercialId
  ? sortedCommerciaux
  : [
      ...sortedCommerciaux,
      { id: commercialId, nom: contract.commercial_name ?? (commercialId === 'quick' ? 'Contrat rapide' : commercialId) },
    ];
```

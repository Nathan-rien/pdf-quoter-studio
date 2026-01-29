
# Plan : Restaurer la structure Saisie/Données + Fonction Dupliquer

## Problème identifié

La modification précédente a changé la structure de l'onglet Matrice :
- **Avant** : Un encart "Saisie" (4 champs en ligne) + un encart "Données" (valeurs calculées sur 3 lignes)
- **Après** : Des cartes "Proposition" individuelles avec les champs de saisie et calculs fusionnés

L'utilisateur souhaite conserver la structure originale et simplement ajouter une fonction "Dupliquer".

## Structure à restaurer (visible sur le screenshot)

### Encart "Saisie" (une seule ligne de 4 champs)
```
+------------------+------------------+------------------+------------------+
| Montant invest HT| Durée (mois)     | Refinancement    | Marge appliquée %|
| [31644]          | [36]             | [Lixxbail 1]     | [6]              |
+------------------+------------------+------------------+------------------+
                                                               [Dupliquer]
```

### Encart "Données" (valeurs calculées en lecture seule)
```
+------------------+------------------+------------------+------------------+
| Montant invest   | Investir Margé   | Services loyers  | Serv loyer inclus|
| 31644,00 € HT    | 33663,83 € HT    | - €              | - €              |
+------------------+------------------+------------------+------------------+
| Durée            | Coefficient      | Loyer invest msg | Loyer mensuel HT | Coût locatif [ON/OFF]
| 36 mois          | 3.0051           | 1011,63 €        | 1011,63 €        | 5,03 %
+------------------+------------------+------------------+------------------+
| Coût du contrat  | Marge Loc        |
| 4774,68 €        | 2019,83 €        |
+------------------+------------------+
```

## Modifications prévues

### Fichier : `src/components/rental-proposal/RentalDataEditor.tsx`

1. **Supprimer** l'import et l'utilisation de `ProposalCard`
2. **Restaurer la section "Saisie"** avec les 4 champs en ligne (grid-cols-4)
3. **Restaurer la section "Données"** avec toutes les valeurs calculées organisées en 3 lignes
4. **Ajouter un bouton "Dupliquer"** dans l'encart Saisie (coin supérieur droit de la Card)
5. **Pour les propositions dupliquées** : Afficher des encarts Saisie/Données supplémentaires avec la même structure, numérotés (Proposition 2, 3, 4...)
6. **Conserver les actions** : Dupliquer et Supprimer par proposition

### Fichier : `src/components/rental-proposal/ProposalCard.tsx`

Supprimer ce fichier (non utilisé après refactorisation) ou le garder vide pour éviter les erreurs d'import.

## Structure finale de l'onglet Matrice

```
+-- Proposition 1 -------------------------------------- [Dupliquer] [X] --+
|                                                                          |
| Saisie                                                                   |
| +---------------+---------------+---------------+---------------+        |
| | Mont inv HT   | Durée (mois)  | Refinancement | Marge (%)     |        |
| | [31644]       | [36]          | [Lixxbail 1]  | [6]           |        |
| +---------------+---------------+---------------+---------------+        |
|                                                                          |
| Données                                                                  |
| +---------------+---------------+---------------+---------------+        |
| | Mont invest   | Invest Margé  | Serv loyers   | Serv inclus   |        |
| | 31644,00 HT   | 33663,83 HT   | - €           | - €           |        |
| +---------------+---------------+---------------+---------------+        |
| | Durée         | Coefficient   | Loyer inv msg | Loyer HT      | [Toggle] Coût locatif |
| | 36 mois       | 3.0051        | 1011,63 €     | 1011,63 €     | 5,03 %  |
| +---------------+---------------+---------------+---------------+        |
| | Coût contrat  | Marge Loc     |                               |        |
| | 4774,68 €     | 2019,83 €     |                               |        |
| +---------------+---------------+-------------------------------+        |
+--------------------------------------------------------------------------+

                                        [+ Ajouter une proposition]
```

## Points techniques

- Le **Montant investissement HT** est maintenant **par proposition** (pas global), car chaque proposition peut avoir un montant différent selon le screenshot
- Le toggle **Coût locatif annuel** reste global (affecte toutes les propositions)
- Le bouton **Supprimer** est désactivé si une seule proposition existe
- Maximum 4 propositions

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/rental-proposal/RentalDataEditor.tsx` | Restaurer structure Saisie/Données, ajouter Dupliquer |
| `src/components/rental-proposal/ProposalCard.tsx` | Refactoriser pour correspondre à la nouvelle structure |
| `src/stores/rentalProposalStore.ts` | Ajouter `montantInvestissement` au type `MatriceProposal` si chaque proposition a son propre montant |



# Plan : Restaurer la structure séparée Saisie / Données

## Problème identifié

La structure actuelle combine "Saisie" et "Données" dans une seule Card avec des sous-sections (`<h4>`). Le screenshot montre clairement que ces deux parties doivent être des **Cards séparées** :

- **Card "Saisie"** : 4 champs modifiables en ligne (Montant invest HT, Durée, Refinancement, Marge appliquée)
- **Card "Données"** : Valeurs calculées en lecture seule sur 3 lignes

## Structure à implémenter (basée sur le screenshot)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Saisie                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Montant invest HT │ Durée (mois)  │ Refinancement   │ Marge appliquée (%)  │
│ [31644]           │ [36]          │ [Lixxbail 1 ▼]  │ [6]                  │
│ (Input)           │ (Input)       │ (Select)        │ (Input)              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Données                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Montant invest    │ Investir Margé     │ Les services...   │ Services de...│
│ 31644,00 € HT     │ 33663,83 € HT      │ - €               │ - €           │
│ (Read-only)       │ (Read-only)        │ (Read-only)       │ (Read-only)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Durée    │ Coefficient │ Loyer invest msg │ Loyer mensuel HT │ [Toggle] Coût│
│ 36 mois  │ 3.0051      │ 1011,63 €        │ 1011,63 €        │ 5,03 %       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Coût du contrat   │ Marge Loc          │                                   │
│ 4774,68 €         │ 2019,83 €          │                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Modifications à effectuer

### Fichier : `src/components/rental-proposal/ProposalCard.tsx`

1. **Séparer en 2 Cards distinctes** au lieu d'une seule Card avec sous-sections
2. **Card Saisie** :
   - CardHeader avec titre "Saisie" et boutons Dupliquer/Supprimer (pour propositions multiples)
   - 4 colonnes avec les champs Input/Select
   - Labels : "Montant investissement HT", "Durée (mois)", "Refinancement", "Marge appliquée (%)"

3. **Card Données** :
   - CardHeader avec titre "Données" seul
   - Ligne 1 (4 colonnes) : Montant investissement, Investir Margé, Les services comprennent des loyers, Services de loyer inclus
   - Ligne 2 (5 colonnes) : Durée, Coefficient, Loyer investissement mensuel, Loyer mensuel HT (mis en avant), Coût locatif annuel (conditionnel)
   - Ligne 3 (2 colonnes) : Coût du contrat, Marge Loc

4. **Labels exacts** selon le screenshot :
   - "Montant investissement" (pas "Montant invest")
   - "Investir Margé"
   - "Les services comprennent des loyers"
   - "Services de loyer inclus"
   - "Loyer investissement mensuel"
   - "Loyer mensuel HT"
   - "Coût locatif annuel" (avec toggle sur la même ligne)

5. **Styling** :
   - Champs read-only avec fond `bg-muted` et coins arrondis
   - Valeurs affichées en noir sur fond gris clair
   - "Loyer mensuel HT" avec fond bleu/primary pour le mettre en avant
   - Toggle "Coût locatif annuel" positionné à droite du label (pas à côté de la valeur)

### Gestion des propositions multiples

Pour les propositions dupliquées :
- Les boutons Dupliquer/Supprimer restent dans le header de la Card "Saisie"
- Un wrapper `<div>` englobe les 2 Cards pour chaque proposition
- Un indicateur "Proposition 1", "Proposition 2" etc. apparaît si plus d'une proposition

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/components/rental-proposal/ProposalCard.tsx` | Restructurer en 2 Cards séparées avec les labels exacts du screenshot |

## Points techniques

- Le toggle "Coût locatif annuel" reste global (géré via `matriceData.showCoutLocatifAnnuel`)
- La prop `showCoutLocatifAnnuel` contrôle l'affichage de la 5ème colonne dans la ligne 2
- Le champ "Montant investissement HT" dans Saisie doit devenir un vrai Input (actuellement read-only)
- Formattage des nombres avec 2 décimales et séparateur de milliers français (`,` pour décimales)


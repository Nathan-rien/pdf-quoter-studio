

# Plan : Optimiser l'espace de la Page 5 (Services)

## Problème identifié

Sur la Page 5 "Votre offre de services", l'option **Pro-Spare** en bas de page n'affiche pas sa description car le contenu dépasse la zone visible (`maxHeight: 75%`).

### Causes
1. **Titres trop grands** : `text-[14px]` pour les noms d'options
2. **Espacements excessifs** : `mb-4`, `space-y-3`, `py-3` entre les blocs
3. **Padding internes** : `px-4 py-2` et `px-4 py-3` dans les headers et contenus

## Modifications à appliquer

### Réductions de taille

| Élément | Avant | Après |
|---------|-------|-------|
| Titres options | `text-[14px]` | `text-[11px]` |
| Titre section "Nos options" | `text-[14px]` | `text-[12px]` |
| Descriptions | `text-[10px]` | `text-[9px]` |
| Icônes (CheckCircle, case vide) | `h-4 w-4` | `h-3 w-3` |
| Barre "Services Inclus" | `w-2.5 h-5` | `w-2 h-4` |

### Réductions d'espacement

| Élément | Avant | Après |
|---------|-------|-------|
| Marge bloc "Services inclus" | `mb-4` | `mb-2` |
| Espace entre options | `space-y-3` | `space-y-1.5` |
| Padding header option | `px-4 py-2` | `px-3 py-1.5` |
| Padding contenu option | `px-4 py-3` | `px-3 py-1.5` |
| Titre "Nos options" | `mt-4 mb-3` | `mt-2 mb-1.5` |

### Position verticale

| Élément | Avant | Après |
|---------|-------|-------|
| Position top du conteneur | `top: 12%` | `top: 8%` |
| Hauteur max du conteneur | `maxHeight: 75%` | `maxHeight: 82%` |

## Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Réduire les espacements et tailles dans `renderServicesInclusPage()` (lignes 812-909) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Appliquer les mêmes réductions dans le HTML généré (lignes 337-396) |

## Résultat attendu

```text
Page 5 optimisée
┌─────────────────────────────────────────────┐
│ Votre offre de services                     │
│ ┌─────────────────────────────────────────┐ │
│ │█ Services Inclus                        │ │ ← Compact
│ │  • Contrat de location...               │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │✓ Pro-Tection                            │ │ ← Titre 11px
│ │  • Assurance casse...                   │ │ ← Desc 9px
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │✓ Pro-Actif                              │ │
│ │  • Audit et valorisation...             │ │
│ └─────────────────────────────────────────┘ │
│ ⚙ Nos options                              │ ← Titre 12px
│ ┌─────────────────────────────────────────┐ │
│ │□ Pro-Optimisée                          │ │
│ │  • Optimisation fiscale...              │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │□ Pro-maintenance                        │ │
│ │  • Maintenance préventive...            │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │□ Pro-Spare                              │ │
│ │  • Stock de matériel... ← VISIBLE       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Points techniques

- Les modifications sont appliquées **simultanément** à l'Aperçu (Preview) et à l'Export PDF pour maintenir la cohérence WYSIWYG
- La réduction de `top: 12%` à `top: 8%` remonte toute la structure de ~30px
- L'augmentation de `maxHeight: 75%` à `maxHeight: 82%` permet d'afficher plus de contenu avant le footer


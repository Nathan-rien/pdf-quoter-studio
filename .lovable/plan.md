

# Plan : Passer la couleur du texte "mois année" en blanc

## Problème identifié

Sur la page de couverture (Page 1), le texte de la date "Janvier 2026" est affiché en couleur verte (`#10b981`) alors qu'il devrait être en blanc pour une meilleure lisibilité sur le fond sombre.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-template-elements.ts` | Changer la couleur de `#10b981` à `#ffffff` |

## Détail de la modification

### pdf-template-elements.ts (ligne 68)

```typescript
// AVANT
createTextElement('p1_date', 1, 'Septembre 2025', { x: 20, y: 150 }, { width: 200, height: 30 }, {
  fontSize: 20,
  color: '#10b981',  // Vert émeraude
}),

// APRÈS
createTextElement('p1_date', 1, 'Septembre 2025', { x: 20, y: 150 }, { width: 200, height: 30 }, {
  fontSize: 20,
  color: '#ffffff',  // Blanc
}),
```

## Résultat attendu

| Avant | Après |
|-------|-------|
| Janvier 2026 (vert `#10b981`) | Janvier 2026 (blanc `#ffffff`) |

## Point technique

Cette modification s'applique aux **nouveaux templates** créés à partir de ce fichier de base. Pour les templates existants déjà enregistrés dans la base de données, la couleur du texte peut être modifiée directement dans l'éditeur de template en sélectionnant l'élément de date et en changeant sa couleur.


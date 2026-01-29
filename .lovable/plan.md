

# Plan : Fusion des services et options sur la Page 5

## Objectif

Regrouper toutes les options de services sur la **Page 5** ("Votre offre de services") et supprimer le contenu dynamique de la Page 6.

## Structure actuelle vs Structure cible

### Actuellement
```text
Page 5 - "Votre offre de services"
├── Services inclus (bloc permanent)
└── Options additionnelles (onglet "Services inclus")

Page 6 - "Votre offre de services"
└── Nos options (onglet "Nos options")
```

### Après modification
```text
Page 5 - "Votre offre de services"
├── Services inclus (bloc permanent)
├── Options additionnelles (onglet "Services inclus")
└── [SI options "Nos options" sélectionnées]
    ├── Titre "Nos options"
    └── Options depuis l'onglet "Nos options"

Page 6 - Devient une page statique (ou supprimée du template)
```

## Fichiers à modifier

### 1. RentalProposalPreview.tsx

**Fonction `renderServicesInclusPage()` (lignes ~812-874)** :
- Ajouter le rendu des `selectedNosOptions` après les options additionnelles
- Insérer un titre "Nos options" conditionnellement affiché si `selectedNosOptions.length > 0`
- Utiliser le même style visuel (cases à cocher vides □ pour les options "Nos options")

**Fonction `renderNosOptionsPage()` (lignes ~876-926)** :
- Supprimer ou vider cette fonction pour ne plus afficher de contenu dynamique sur la page 6
- La page 6 deviendra une page statique (éléments du template uniquement)

**Fonction `renderCurrentPage()` (ligne ~1034)** :
- Retirer le cas `currentPreviewPage === 6 → renderNosOptionsPage()`
- La page 6 utilisera `renderGenericStaticPage(6)` comme les autres pages statiques

### 2. RentalProposalExport.tsx

**Fonction `generateDynamicContentByPage()` (lignes ~337-396)** :
- Modifier `dynamicContent[5]` pour inclure les "Nos options" après les options additionnelles
- Supprimer `dynamicContent[6]` (plus d'injection dynamique sur la page 6)

### 3. RentalDataEditor.tsx (optionnel, UI)

- Mettre à jour le badge de l'onglet "Nos options" : remplacer "Page 6" par "Page 5" pour refléter le changement

## Détail technique

### Structure HTML/JSX de la Page 5 après modification

```jsx
<div className="dynamic-content">
  {/* Bloc permanent "Services inclus" */}
  <div className="services-inclus-block">
    <header>Services Inclus</header>
    <ul>{servicesInclus.description...}</ul>
  </div>

  {/* Options additionnelles (depuis onglet "Services inclus") */}
  {selectedOptions.map(option => (
    <div className="option-card">
      <CheckCircle /> {option.name}
      {option.description}
    </div>
  ))}

  {/* NOUVEAU: Nos options (depuis onglet "Nos options") */}
  {selectedNosOptions.length > 0 && (
    <>
      <h4 className="section-title">Nos options</h4>
      {selectedNosOptions.map(option => (
        <div className="option-card">
          <Checkbox vide /> {option.name}
          {option.description}
        </div>
      ))}
    </>
  )}
</div>
```

### Différenciation visuelle

| Source | Icône | Signification |
|--------|-------|---------------|
| Services inclus | Barre verticale | Bloc permanent, toujours présent |
| Options additionnelles (onglet "Services inclus") | ✓ CheckCircle | Option déjà activée |
| Nos options (onglet "Nos options") | □ Case vide | Option proposée au client (à cocher sur document imprimé) |

## Points de vigilance

1. **Espace vertical** : Avec potentiellement plus de contenu sur la Page 5, s'assurer que le `maxHeight` ou l'`overflow` est adapté
2. **Cohérence PDF** : Le HTML généré pour l'export doit refléter exactement l'aperçu React
3. **Page 6 statique** : Si le template contient des éléments statiques sur la page 6, ils seront toujours affichés

## Estimation

- **Complexité** : Faible à moyenne
- **Fichiers impactés** : 2 principaux (Preview + Export), 1 optionnel (DataEditor)
- **Risque de régression** : Faible si les styles sont conservés


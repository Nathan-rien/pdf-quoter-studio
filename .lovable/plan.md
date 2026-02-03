

# Plan : Supprimer les avertissements de zones manquantes à la sauvegarde

## Contexte

Lors de la sauvegarde du template, des avertissements informatifs s'affichent si certains types de zones dynamiques sont absents (Bloc Location, Tableau Invest, Bloc Options). Ces avertissements ne bloquent pas la sauvegarde mais peuvent être perçus comme gênants.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/template-validation.ts` | Supprimer les warnings de zones manquantes |

## Modification

Supprimer le bloc de code qui génère les warnings pour les zones "classiques" manquantes (lignes 49-79) :

```typescript
// À SUPPRIMER (lignes 49-79) :

// 3. Ajouter des warnings informatifs si des types de zones "classiques" manquent
const presentZoneTypes = new Set(
  version.pages.flatMap(p => p.dynamicZones.map(z => z.type))
);

const zoneTypeLabels: Record<DynamicZoneType, string> = {
  'invest_table': 'Tableau Invest',
  'location_block': 'Bloc Location',
  'options_block': 'Bloc Options'
};

if (!presentZoneTypes.has('invest_table')) {
  warnings.push({
    type: 'missing_zone',
    message: 'Aucune zone "Tableau Invest" - les données produits ne seront pas injectées'
  });
}

if (!presentZoneTypes.has('location_block')) {
  warnings.push({
    type: 'missing_zone', 
    message: 'Aucune zone "Bloc Location" - les conditions de location ne seront pas injectées'
  });
}

if (!presentZoneTypes.has('options_block')) {
  warnings.push({
    type: 'missing_zone',
    message: 'Aucune zone "Bloc Options" - les services ne seront pas injectés'
  });
}
```

## Résultat

- La boîte de dialogue de sauvegarde n'affichera plus les avertissements sur les zones manquantes
- Les autres validations (pages vides, texte vide, etc.) resteront actives
- La section "Avertissements" ne s'affichera plus si aucun autre warning n'est détecté


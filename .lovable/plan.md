
# Plan : Ajouter la sélection de template dans le workflow

## Problème identifié

À l'étape "Template" du workflow de proposition, `TemplateListView` affiche uniquement les actions de gestion (Éditer, Dupliquer, Supprimer). Il n'y a pas de moyen de **sélectionner** un template pour la proposition.

Le système utilise actuellement `isActive` pour marquer le template par défaut, mais cette propriété n'est pas modifiable depuis l'interface workflow.

## Solution

Créer un composant dédié `TemplateSelector` pour le workflow, distinct de `TemplateListView` (gestion). Ce composant permettra de :
- Afficher les templates disponibles avec un indicateur de sélection visuel
- Cliquer sur une carte pour sélectionner le template
- Stocker le template sélectionné dans `rentalProposalStore`

## Modifications prévues

### 1. Ajouter l'état `selectedTemplateId` dans `rentalProposalStore.ts`

Ajouter un champ pour stocker le template sélectionné pour la proposition :

```typescript
interface RentalProposalState {
  // ... autres champs
  selectedTemplateId: string | null;
}

interface RentalProposalActions {
  // ... autres actions
  selectTemplateForProposal: (templateId: string) => void;
}
```

### 2. Créer le composant `TemplateSelector.tsx`

Nouveau fichier `src/components/rental-proposal/TemplateSelector.tsx` :

```typescript
export function TemplateSelector() {
  const { selectedTemplateId, selectTemplateForProposal } = useRentalProposalStore();
  const { allTemplates, getTemplateLatestVersion } = useTemplateEditorStore();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allTemplates.map((template) => (
        <Card 
          key={template.id}
          variant={selectedTemplateId === template.id ? 'selected' : 'interactive'}
          className="cursor-pointer"
          onClick={() => selectTemplateForProposal(template.id)}
        >
          {/* Contenu de la carte avec indicateur de sélection */}
          {selectedTemplateId === template.id && (
            <Badge className="absolute -top-2 -right-2 bg-primary">
              <Check className="h-3 w-3 mr-1" />
              Sélectionné
            </Badge>
          )}
          {/* ... nom, description, version */}
        </Card>
      ))}
    </div>
  );
}
```

### 3. Modifier `RentalWorkflow.tsx`

Remplacer `TemplateListView` par `TemplateSelector` pour l'étape "template" :

```typescript
// AVANT
case 'template':
  return (
    <Card key="step-template">
      <CardContent>
        <TemplateListView />  // Interface de gestion
      </CardContent>
    </Card>
  );

// APRÈS
case 'template':
  return (
    <Card key="step-template">
      <CardContent>
        <TemplateSelector />  // Interface de sélection
      </CardContent>
    </Card>
  );
```

### 4. Modifier `RentalProposalPreview.tsx`

Utiliser `selectedTemplateId` du store au lieu de `getActiveTemplate()` :

```typescript
// AVANT
const activeTemplate = getActiveTemplate();

// APRÈS
const { selectedTemplateId } = useRentalProposalStore();
const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId) 
  || getActiveTemplate(); // Fallback vers le template actif
```

### 5. Ajouter la condition de navigation

Bloquer le passage à l'étape "Aperçu" tant qu'aucun template n'est sélectionné :

```typescript
case 'preview':
  return state.pdfImportStatus.isImported 
    && state.lignesData.length > 0
    && state.selectedTemplateId !== null;  // Nouveau
```

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/stores/rentalProposalStore.ts` | Ajouter `selectedTemplateId` et `selectTemplateForProposal` |
| `src/components/rental-proposal/TemplateSelector.tsx` | Nouveau composant de sélection |
| `src/components/rental-proposal/RentalWorkflow.tsx` | Utiliser `TemplateSelector` au lieu de `TemplateListView` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Utiliser `selectedTemplateId` du store |

## Interface utilisateur

### Étape "Template" - Avant

```text
┌────────────────────────────┐
│ Proposition Commerciale    │
│ [Éditer] [📋] [🗑]         │  ← Actions de gestion uniquement
└────────────────────────────┘
```

### Étape "Template" - Après

```text
┌────────────────────────────┐     ┌────────────────────────────┐
│ Proposition Cybertek       │     │ ✓ Sélectionné              │
│ v90 - Publié               │     │ Proposition Grosbill       │
│ [Cliquer pour sélectionner]│     │ v1 - Publié                │
└────────────────────────────┘     └────────────────────────────┘
```

## Comportement attendu

1. L'utilisateur arrive à l'étape "Template"
2. Il voit les templates disponibles avec leur aperçu
3. Il clique sur un template pour le sélectionner
4. Un badge "Sélectionné" apparaît sur la carte
5. Le bouton "Suivant" devient actif
6. L'aperçu utilise le template sélectionné

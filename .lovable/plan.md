## Associer un template à une vue (Location ou Services)

### 1. Base de données
Ajouter une colonne `target_view` sur `pdf_templates` :
- Type `text`, valeurs autorisées via check : `'location' | 'services' | null`
- Nullable ; migration : `ALTER TABLE public.pdf_templates ADD COLUMN target_view text CHECK (target_view IN ('location','services'))`
- Pas de valeur par défaut : les templates existants restent non assignés jusqu'à sélection manuelle

### 2. Type & sync
- `src/types/template-editor.ts` — ajouter `targetView: 'location' | 'services' | null` dans `PDFTemplate`
- `src/hooks/useTemplateSync.ts` — mapper `db.target_view` ↔ `template.targetView` dans `dbToStoreTemplate` / `storeToDbTemplate`, et sauver la valeur dans `upsertTemplate`
- `src/stores/templateEditorStore.ts` — ajouter action `setTemplateTargetView(templateId, targetView)` qui met à jour le template en mémoire, marque `updatedAt`, puis persiste via `saveTemplateToDatabase`

### 3. UI éditeur (`TemplateListView.tsx`)
Sur chaque carte de template, sous la description, ajouter un `<Select>` compact :
- Options : « Proposition Location », « Proposition Services », « Non assignée »
- Valeur liée à `template.targetView` ; `onValueChange` appelle `setTemplateTargetView`
- Badge visuel discret à côté du nom (couleur différenciée par vue) pour repérage rapide
- Toast de confirmation « Template associé à Proposition Location » / etc.

### 4. Filtrage dans le sélecteur (`TemplateSelector.tsx`)
Le composant est partagé entre location et services : ajouter une prop `viewScope: 'location' | 'services'`.
- `RentalWorkflow.tsx` : `<TemplateSelector viewScope="location" />`
- `ServiceProposalView.tsx` : `<TemplateSelector viewScope="services" />`

Filtre :
```ts
const availableTemplates = allTemplates.filter(t =>
  !!getTemplatePublishedVersion(t.id) && t.targetView === viewScope
);
```
Les templates non assignés (ou assignés à l'autre vue) n'apparaissent pas — conforme à la demande.

Message vide adapté : « Aucun template n'est associé à cette vue. Rendez-vous dans l'éditeur de templates pour en associer un. »

### 5. Fichiers touchés
- migration Supabase (nouvelle)
- `src/types/template-editor.ts`
- `src/hooks/useTemplateSync.ts`
- `src/stores/templateEditorStore.ts`
- `src/components/template-editor/TemplateListView.tsx`
- `src/components/rental-proposal/TemplateSelector.tsx`
- `src/components/rental-proposal/RentalWorkflow.tsx`
- `src/components/service-proposal/ServiceProposalView.tsx`

Aucune modification des snapshots de propositions existantes ; les propositions déjà validées conservent leur `selectedTemplateId` même si le template est plus tard réassigné à l'autre vue.



## Auto-selection du commercial et du template pour les commerciaux

### Contexte

Actuellement, les commerciaux doivent manuellement selectionner leur entite, leur nom, et le template correspondant a chaque proposition. L'objectif est d'automatiser ces choix pour les utilisateurs ayant le role "commercial", tout en laissant les administrateurs libres de tout modifier.

### Deux comportements selon le role

| Comportement | Commercial | Admin |
|---|---|---|
| Entite et nom pre-remplis et verrouilles | Oui | Non |
| Etape "Template" visible dans le workflow | Non (auto-selection) | Oui |
| Passage de "Donnees" a "Apercu" | Direct | Via l'etape Template |

### Correspondance entite / template

Les templates en base de donnees sont :
- **Cybertek Pro** : `fd0e078b-0000-4000-8000-000000000000` ("Proposition Commerciale CybertekPro")
- **Grosbill Pro** : `f153bcea-1770-4021-8446-177002144623` ("Proposition Commerciale GrosbillPro")

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalWorkflow.tsx` | Recevoir `isAdmin`/`isCommercial` via props ou hook. Masquer l'etape "Template" pour les commerciaux. Auto-selectionner le template quand le commercial est identifie. Adapter la navigation (Donnees -> Apercu directement). |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Utiliser `useCommercialIdentity` et `useAuth` pour pre-remplir et verrouiller (lecture seule) les champs entite/commercial quand l'utilisateur a le role commercial. |
| `src/stores/rentalProposalStore.ts` | Adapter `canNavigateToStep` pour accepter un parametre optionnel indiquant que l'etape template est masquee (ou rendre la logique independante de l'etape template quand le template est deja selectionne). |
| `src/pages/Index.tsx` | Passer les props de role au `RentalWorkflow` si necessaire. |

### Detail technique

**1. RentalDataEditor - Verrouillage commercial**

Importer `useCommercialIdentity` et `useAuth`. Quand `isCommercial` est vrai et que l'identite commerciale est resolue :
- Pre-remplir `commercialData.entity` et `commercialData.commercialId` via les actions du store (`updateCommercialEntity`, `selectCommercial`) dans un `useEffect`.
- Rendre les deux `Select` en mode `disabled` avec un badge "Verrouille" a cote.
- L'admin conserve l'acces complet aux selecteurs.

**2. RentalWorkflow - Masquer l'etape Template**

- Importer `useAuth` et `useCommercialIdentity`.
- Definir un flag `skipTemplateStep = isCommercial && !isAdmin`.
- Filtrer `WORKFLOW_STEPS` pour exclure l'etape `'template'` quand `skipTemplateStep` est vrai.
- Dans un `useEffect`, quand `skipTemplateStep` est vrai et que l'entite du commercial est connue, appeler `selectTemplateForProposal(templateId)` avec l'ID correspondant a l'entite :

```text
const ENTITY_TEMPLATE_MAP: Record<CommercialEntity, string> = {
  'cybertek-pro': 'fd0e078b-0000-4000-8000-000000000000',
  'grosbill-pro': 'f153bcea-1770-4021-8446-177002144623',
};
```

**3. Store - Adapter canNavigateToStep**

Le `canNavigateToStep` utilise un tableau ordonne `['import', 'data', 'template', 'preview', 'export']`. Quand l'etape template est masquee, la navigation doit passer directement de `'data'` a `'preview'`. Deux approches possibles :
- Passer le flag `skipTemplateStep` dans les composants et adapter la logique dans `RentalWorkflow` (plus simple, pas de changement au store).
- Concretement : dans `RentalWorkflow`, la variable `WORKFLOW_STEPS` filtree est deja utilisee pour `handleNext`/`handlePrevious`, donc la navigation fonctionnera naturellement. Il suffit d'ajuster `canNavigateToStep` dans le store pour ne pas exiger que `currentStep === 'template'` avant `'preview'` quand `selectedTemplateId` est deja rempli.

La modification dans le store sera minimale : dans le cas `'preview'`, la condition verifie deja `selectedTemplateId !== null`, ce qui sera satisfait par l'auto-selection. Il faut juste permettre de sauter de `'data'` a `'preview'` (actuellement bloque par `targetIndex > currentIndex + 1`). On ajoutera un parametre optionnel `skipTemplate?: boolean` a `canNavigateToStep`, ou bien on assouplira la regle : si `selectedTemplateId` est deja rempli, on autorise le saut de l'etape template.

**4. Pas de changement dans Index.tsx** - Les hooks `useAuth` et `useCommercialIdentity` seront appeles directement dans les composants concernes.


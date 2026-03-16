

## Plan : Élargir la sidebar de navigation

### Problème

La sidebar a une largeur fixe de `w-44` (11rem / 176px), ce qui tronque les labels longs comme "Diagramme de Gantt".

### Correction (1 fichier)

**`src/components/layout/AppSidebar.tsx`** ligne 37 — Changer `w-44` en `w-52` (13rem / 208px) :

```typescript
<aside className="w-52 bg-card border-r border-border flex flex-col h-screen sticky top-0">
```

Cela donne ~32px supplémentaires, suffisant pour afficher "Diagramme de Gantt" et tous les autres labels sans troncature.


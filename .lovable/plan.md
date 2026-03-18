

## Plan : Corriger le drag & drop des jalons (mise à jour optimiste)

### Diagnostic

Le problème vient du realtime : quand on déplace un jalon, `reorderMilestones` envoie les updates au serveur, mais le listener realtime déclenche un `fetchAll()` qui recharge l'ancien état avant que toutes les updates soient confirmées. Le jalon "saute" à sa position d'origine.

### Correction (1 fichier : `src/hooks/useGanttData.ts`)

Appliquer des **mises à jour optimistes** sur les 3 fonctions de réordonnancement (`reorderProjects`, `reorderTasks`, `reorderMilestones`) :

1. **Mettre à jour le state local immédiatement** avec le nouvel ordre avant d'envoyer au serveur
2. **En cas d'erreur serveur**, rollback au state précédent et afficher un toast d'erreur
3. Le realtime confirmera ensuite avec les données serveur (qui correspondront déjà au state local)

Exemple pour `reorderMilestones` :
```typescript
const reorderMilestones = async (orderedIds: string[]) => {
  const previous = [...milestones]; // snapshot
  // Optimistic update
  setMilestones(prev => {
    const map = new Map(prev.map(m => [m.id, m]));
    return orderedIds
      .map((id, i) => { const m = map.get(id); return m ? { ...m, sort_order: (i+1)*10 } : null; })
      .filter(Boolean)
      .concat(prev.filter(m => !orderedIds.includes(m.id)));
  });
  // Server update
  const updates = orderedIds.map((id, i) => supabase.from('gantt_milestones').update({ sort_order: (i+1)*10 }).eq('id', id));
  const results = await Promise.all(updates);
  if (results.some(r => r.error)) {
    setMilestones(previous); // rollback
    toast.error('Erreur réordonnancement');
  }
};
```

Appliquer le même pattern pour `reorderProjects` (avec `setProjects`) et `reorderTasks` (avec `setTasks`).


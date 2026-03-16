

## Plan : Étendre la vue Année jusqu'à fin 2027

### Modification (1 fichier)

**`src/components/gantt/GanttTimeline.tsx`** — Changer `END_DATE` de fin 2026 à fin 2027 :

```typescript
const END_DATE = new Date(2027, 11, 31);
```

Cela ajoute une année complète de jours ouvrés à la timeline, permettant de visualiser et planifier des projets jusqu'à fin 2027 dans tous les niveaux de zoom.


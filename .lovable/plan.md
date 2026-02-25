

## Probleme

Le numero de telephone des commerciaux est lu depuis le fichier statique `src/data/commerciaux.ts` (tableau `COMMERCIAUX` code en dur). Quand l'admin modifie le telephone dans l'onglet Acces (table `pre_registered_commercials`), le workflow continue d'afficher l'ancien numero car il ne consulte jamais la base de donnees.

Deux endroits critiques :
1. **`getCommerciauxByEntity()`** dans `RentalDataEditor.tsx` — liste les commerciaux depuis le statique
2. **`getSelectedCommercial()`** dans `rentalProposalStore.ts` — recupere le commercial selectionne depuis le statique

## Plan de correction

### Approche

Enrichir les fonctions `getCommercialById` et `getCommerciauxByEntity` avec les donnees dynamiques de la base. Concretement, creer un hook `useCommerciaux` qui charge les `pre_registered_commercials` et fusionne le telephone de la base avec les donnees statiques.

### Modifications

| Fichier | Detail |
|---|---|
| **Nouveau hook `src/hooks/useCommerciaux.ts`** | Hook React Query qui charge tous les `pre_registered_commercials` et retourne deux fonctions : `getCommerciauxByEntity(entity)` et `getCommercialById(id)` qui fusionnent le telephone de la base avec les donnees statiques. Le telephone de la base a priorite sur le statique. |
| **`RentalDataEditor.tsx`** | Remplacer l'import de `getCommerciauxByEntity` depuis `commerciaux.ts` par le hook `useCommerciaux`. Utiliser les fonctions dynamiques pour la liste et l'apercu du commercial selectionne. |
| **`rentalProposalStore.ts`** | La fonction `getSelectedCommercial()` du store ne peut pas utiliser un hook. Deux options : (a) la supprimer et deplacer la logique dans le composant, ou (b) la garder comme fallback statique. Approche retenue : dans `RentalDataEditor`, utiliser le hook pour l'affichage et ignorer `getSelectedCommercial()` du store pour l'apercu. |

### Detail du hook `useCommerciaux`

```typescript
// src/hooks/useCommerciaux.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COMMERCIAUX, CommercialEntity, Commercial } from '@/data/commerciaux';

export function useCommerciaux() {
  const { data: dbCommerciaux } = useQuery({
    queryKey: ['pre-registered-commercials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pre_registered_commercials')
        .select('commercial_id, telephone');
      return data || [];
    },
    staleTime: 30_000,
  });

  // Fusionne : telephone DB prioritaire sur statique
  const merged = COMMERCIAUX.map(c => {
    const dbEntry = dbCommerciaux?.find(d => d.commercial_id === c.id);
    return dbEntry ? { ...c, telephone: dbEntry.telephone ?? c.telephone } : c;
  });

  const getByEntity = (entity: CommercialEntity) => 
    merged.filter(c => c.entity === entity);

  const getById = (id: string) => 
    merged.find(c => c.id === id) ?? null;

  return { getCommerciauxByEntity: getByEntity, getCommercialById: getById };
}
```

### Modifications dans `RentalDataEditor.tsx`

- Importer `useCommerciaux` au lieu de `getCommerciauxByEntity`
- Appeler le hook : `const { getCommerciauxByEntity, getCommercialById } = useCommerciaux()`
- Remplacer `getSelectedCommercial()` du store par `getCommercialById(commercialData.commercialId)` pour l'apercu
- La liste des commerciaux dans le `Select` utilisera la version dynamique

### Impact sur les autres consommateurs

- `useCommercialIdentity.ts` : utilise aussi `getCommercialById` statique pour l'onglet "Mes infos". Meme correction a appliquer en utilisant le hook `useCommerciaux`.
- `rentalProposalStore.ts` : `getSelectedCommercial()` reste en fallback statique pour les usages hors composant (export PDF, etc.). Le telephone dans l'export sera corrige dans un second temps si necessaire.

### Aucune migration DB necessaire

Les donnees sont deja dans `pre_registered_commercials`. Il s'agit uniquement d'un changement cote client.


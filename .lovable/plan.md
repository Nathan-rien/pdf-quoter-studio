
## Persistance des Options Services en base de données

### Diagnostic

Le store `options-admin-storage` utilise uniquement `localStorage` via Zustand `persist`. Le problème est double :

1. **L'ErrorBoundary supprime `options-admin-storage`** à chaque erreur DOM (`removeChild`) — visible dans les logs console. Les modifications sont donc effacées régulièrement.
2. **Les `defaultOptions` du store** sont re-générées avec `crypto.randomUUID()` à chaque rechargement du module, ce qui écrase les données sauvegardées si le cache est vidé.

La solution robuste est de persister les Options Services dans la base de données (comme les templates PDF), avec le localStorage uniquement comme cache temporaire.

---

### Architecture cible

```text
[Utilisateur modifie une option]
        |
        v
[Store Zustand (état local immédiat)]
        |
        v
[Upsert vers la base de données (auto-save)]
        |
        v
[Au démarrage : chargement depuis la base]
```

---

### Migration base de données

Création d'une nouvelle table `options_services` :

```sql
CREATE TABLE public.options_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  price jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS : tous les utilisateurs authentifiés peuvent lire
-- Seuls les admins peuvent modifier
ALTER TABLE public.options_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view options"
  ON public.options_services FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert options"
  ON public.options_services FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update options"
  ON public.options_services FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete options"
  ON public.options_services FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

Les données par défaut actuelles seront insérées via une migration SQL `INSERT ... ON CONFLICT DO NOTHING`.

---

### Modifications — 4 fichiers

**1. Migration SQL** (nouvelle migration)

Table `options_services` avec les 10 options par défaut pré-insérées (IDs fixes pour éviter les doublons).

**2. `src/stores/optionsAdminStore.ts`**

Réécriture du store pour :
- Garder Zustand pour l'état local (UX réactive)
- Ajouter un hook `useOptionsAdminSync` qui :
  - Charge les options depuis la base au montage (priorité sur le localStorage)
  - Sauvegarde automatiquement chaque modification en base (via Supabase upsert/delete)
- Conserver `persist` en localStorage uniquement comme cache offline/fallback

**3. `src/pages/OptionsServicesAdmin.tsx`**

Ajouter un indicateur de synchronisation (icône de chargement ou badge "Sauvegardé") pour que l'utilisateur voie que ses modifications sont bien persistées.

**4. `src/components/ErrorBoundary.tsx`**

Retirer `options-admin-storage` de la liste des clés effacées lors des erreurs DOM — ce store ne cause pas d'erreurs DOM et ne doit pas être vidé lors d'erreurs liées aux templates.

---

### Flux de données détaillé

**Chargement initial :**
1. Au montage du composant `OptionsServicesAdmin`, appel `supabase.from('options_services').select('*').order('sort_order')`
2. Si des données existent en base → remplacent le state Zustand et le cache localStorage
3. Si la base est vide → insertion des `defaultOptions` en base + mise à jour du store

**Sauvegarde automatique :**
- Chaque `updateOption`, `addOption`, `deleteOption`, etc. met à jour le state Zustand immédiatement (UX réactive)
- En parallèle, appel Supabase `upsert` ou `delete` en arrière-plan
- En cas d'erreur réseau : le state local reste intact, toast d'avertissement

**Résultat :**
- Les modifications survivent aux rechargements de page
- Les modifications survivent aux nettoyages de cache localStorage
- Pas de perte de données lors des erreurs DOM des autres composants

---

### Résumé des fichiers modifiés

| Fichier | Type de changement |
|---|---|
| `supabase/migrations/[timestamp]_create_options_services.sql` | Nouveau — table + RLS + données par défaut |
| `src/stores/optionsAdminStore.ts` | Ajout sync Supabase (chargement + auto-save) |
| `src/pages/OptionsServicesAdmin.tsx` | Ajout indicateur de sauvegarde |
| `src/components/ErrorBoundary.tsx` | Retrait de `options-admin-storage` de la liste effacée |

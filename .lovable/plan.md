## Bug

Dans `proposal_exports` (historique Location), les policies RLS filtrent uniquement sur `created_by = auth.uid()`. Quand un admin crée une proposition et l'attribue à un commercial via `commercial_id`, `created_by` reste l'admin — le commercial ne voit donc jamais la proposition dans son historique.

À noter : `service_proposals` a déjà la bonne policy (`commercial_id = get_user_commercial_id(auth.uid())`), donc le correctif se limite à `proposal_exports`. `ServiceHistoryView` est réservé aux admins côté route, donc rien à changer là.

## Correctif (migration SQL)

Remplacer les policies SELECT / UPDATE / DELETE de `proposal_exports` pour ajouter la condition d'attribution commerciale :

```sql
DROP POLICY "Users can view own proposals"   ON public.proposal_exports;
DROP POLICY "Users can update own proposals" ON public.proposal_exports;
DROP POLICY "Users can delete own proposals" ON public.proposal_exports;

CREATE POLICY "Users can view own proposals" ON public.proposal_exports
FOR SELECT USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
);

CREATE POLICY "Users can update own proposals" ON public.proposal_exports
FOR UPDATE USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR commercial_id = public.get_user_commercial_id(auth.uid())
);

CREATE POLICY "Users can delete own proposals" ON public.proposal_exports
FOR DELETE USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

La policy INSERT reste inchangée (`created_by = auth.uid()`).

## Vérification

- Se connecter en tant que commercial ; l'historique Location doit lister les propositions dont `commercial_id` correspond, même si `created_by` est un admin.
- L'admin conserve la visibilité totale ; le créateur d'origine garde l'accès.
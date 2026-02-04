-- 1. Ajouter la colonne created_by pour tracer le créateur
ALTER TABLE public.proposal_exports 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "Public read proposal_exports" ON public.proposal_exports;
DROP POLICY IF EXISTS "Public insert proposal_exports" ON public.proposal_exports;
DROP POLICY IF EXISTS "Public delete proposal_exports" ON public.proposal_exports;

-- 3. Créer des policies sécurisées

-- SELECT: Les utilisateurs voient leurs propres propositions, les admins voient tout
CREATE POLICY "Users can view own proposals"
ON public.proposal_exports
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- INSERT: Les utilisateurs authentifiés peuvent créer leurs propositions
CREATE POLICY "Users can create own proposals"
ON public.proposal_exports
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

-- UPDATE: Les propriétaires ou admins peuvent modifier
CREATE POLICY "Users can update own proposals"
ON public.proposal_exports
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- DELETE: Les propriétaires ou admins peuvent supprimer
CREATE POLICY "Users can delete own proposals"
ON public.proposal_exports
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  )
);
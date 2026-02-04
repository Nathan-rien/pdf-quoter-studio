-- =====================================================
-- FIX: pdf_templates et template_versions sont publiques
-- Problème: Anyone can INSERT/UPDATE/DELETE all data
-- Solution: Restreindre aux admins authentifiés
-- =====================================================

-- 1. Supprimer les anciennes policies dangereuses sur pdf_templates
DROP POLICY IF EXISTS "Anyone can insert templates" ON public.pdf_templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON public.pdf_templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.pdf_templates;
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.pdf_templates;

-- 2. Supprimer les anciennes policies dangereuses sur template_versions
DROP POLICY IF EXISTS "Anyone can insert versions" ON public.template_versions;
DROP POLICY IF EXISTS "Anyone can update versions" ON public.template_versions;
DROP POLICY IF EXISTS "Anyone can delete versions" ON public.template_versions;
DROP POLICY IF EXISTS "Template versions are publicly readable" ON public.template_versions;

-- 3. Nouvelles policies sécurisées pour pdf_templates
-- SELECT: Utilisateurs authentifiés peuvent lire (nécessaire pour le workflow)
CREATE POLICY "Authenticated users can view templates"
ON public.pdf_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Seuls les admins peuvent créer des templates
CREATE POLICY "Admins can insert templates"
ON public.pdf_templates
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: Seuls les admins peuvent modifier des templates
CREATE POLICY "Admins can update templates"
ON public.pdf_templates
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- DELETE: Seuls les admins peuvent supprimer des templates
CREATE POLICY "Admins can delete templates"
ON public.pdf_templates
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Nouvelles policies sécurisées pour template_versions
-- SELECT: Utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view template versions"
ON public.template_versions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Seuls les admins peuvent créer des versions
CREATE POLICY "Admins can insert template versions"
ON public.template_versions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: Seuls les admins peuvent modifier des versions
CREATE POLICY "Admins can update template versions"
ON public.template_versions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- DELETE: Seuls les admins peuvent supprimer des versions
CREATE POLICY "Admins can delete template versions"
ON public.template_versions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Sécuriser la policy SELECT sur profiles (issue précédente)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
);
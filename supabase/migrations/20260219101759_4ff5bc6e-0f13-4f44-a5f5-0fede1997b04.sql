
-- 1. Créer la table des commerciaux pré-enregistrés
CREATE TABLE public.pre_registered_commercials (
  email text PRIMARY KEY,
  full_name text NOT NULL,
  commercial_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS pour pre_registered_commercials
ALTER TABLE public.pre_registered_commercials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pre_registered_commercials"
  ON public.pre_registered_commercials
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trigger function can read pre_registered_commercials"
  ON public.pre_registered_commercials
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Insérer les commerciaux pré-enregistrés
INSERT INTO public.pre_registered_commercials (email, full_name, commercial_id) VALUES
  ('v.bordaraud@cybertek-pro.fr', 'Victor Bordaraud', 'vb-cybertek'),
  ('j.weill@cybertek-pro.fr', 'Johanna Weill', 'jw-cybertek'),
  ('m.houdbert@cybertek-pro.fr', 'Mathis Houdbert', 'mh-cybertek'),
  ('a.aboutaib@cybertek-pro.fr', 'Adil Aboutaib', 'aa-cybertek'),
  ('c.besse@picata.fr', 'Christophe Besse', 'cb-cybertek'),
  ('m.kharsou@grosbill-pro.com', 'Mehdi Kharsou', 'mk-grosbill'),
  ('m.kaderi@grosbill-pro.com', 'Malek Kaderi', 'mk2-grosbill'),
  ('j.breton@grosbill-pro.com', 'Jonathan Breton', 'jb-grosbill');

-- 3. Ajouter les colonnes à proposal_exports
ALTER TABLE public.proposal_exports
  ADD COLUMN IF NOT EXISTS commercial_id text,
  ADD COLUMN IF NOT EXISTS commercial_name text,
  ADD COLUMN IF NOT EXISTS montant_investissement numeric;

-- 4. Mettre à jour le trigger handle_new_user pour auto-attribuer le rôle commercial
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_commercial pre_registered_commercials%ROWTYPE;
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Vérifier si l'email est pré-enregistré comme commercial
  SELECT * INTO v_commercial
  FROM public.pre_registered_commercials
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    -- Auto-attribuer le rôle commercial
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'commercial'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Créer le trigger sur auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Activer Realtime sur proposal_exports
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_exports;

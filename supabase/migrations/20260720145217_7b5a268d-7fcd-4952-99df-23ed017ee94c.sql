-- Backups table & bucket
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  file_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  tables_count INTEGER NOT NULL DEFAULT 0,
  rows_count INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  kind TEXT NOT NULL DEFAULT 'manual',
  restored_from UUID REFERENCES public.backups(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, DELETE ON public.backups TO authenticated;
GRANT ALL ON public.backups TO service_role;

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backups"
  ON public.backups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert backups"
  ON public.backups FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backups"
  ON public.backups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for the 'backups' bucket (bucket itself created via storage tool)
CREATE POLICY "Admins can read backup files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload backup files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_number text,
  ADD COLUMN IF NOT EXISTS monthly_rent_ht numeric,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Storage policies for contract-attachments bucket (bucket created via tool)
CREATE POLICY "Authenticated can read contract attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contract-attachments');

CREATE POLICY "Authenticated can upload contract attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contract-attachments');

CREATE POLICY "Authenticated can update contract attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contract-attachments');

CREATE POLICY "Authenticated can delete contract attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contract-attachments');


ALTER TABLE public.pre_registered_commercials
  ADD COLUMN IF NOT EXISTS entity text,
  ADD COLUMN IF NOT EXISTS adresse text;

UPDATE public.pre_registered_commercials
SET entity = 'cybertek-pro'
WHERE entity IS NULL AND commercial_id LIKE '%-cybertek';

UPDATE public.pre_registered_commercials
SET entity = 'grosbill-pro'
WHERE entity IS NULL AND commercial_id LIKE '%-grosbill';

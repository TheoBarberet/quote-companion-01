-- Add UPDATE policy for etapes_production_catalogue
CREATE POLICY "Authenticated users can update production steps"
ON public.etapes_production_catalogue
FOR UPDATE
USING (auth.uid() IS NOT NULL);
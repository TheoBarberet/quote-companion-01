-- Add DELETE policy for etapes_production_catalogue
CREATE POLICY "Authenticated users can delete production steps"
ON public.etapes_production_catalogue
FOR DELETE
USING (auth.uid() IS NOT NULL);
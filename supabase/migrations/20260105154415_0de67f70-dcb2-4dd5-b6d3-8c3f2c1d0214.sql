-- Add url column to track source URLs for components and materials
-- Note: These are stored in JSON columns, so we'll update the application types

-- First, let's add a new transport_info column to store calculated transport details
ALTER TABLE public.devis 
ADD COLUMN IF NOT EXISTS transport_info JSONB DEFAULT NULL;
-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  designation TEXT NOT NULL,
  variantes TEXT,
  composants JSONB DEFAULT '[]'::jsonb,
  matieres_premieres JSONB DEFAULT '[]'::jsonb,
  etapes_production JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devis table
CREATE TABLE public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  client_reference TEXT,
  client_nom TEXT,
  client_adresse TEXT,
  client_email TEXT,
  client_telephone TEXT,
  produit JSONB DEFAULT '{}'::jsonb,
  composants JSONB DEFAULT '[]'::jsonb,
  matieres_premieres JSONB DEFAULT '[]'::jsonb,
  etapes_production JSONB DEFAULT '[]'::jsonb,
  transport JSONB DEFAULT '{}'::jsonb,
  marge_cible NUMERIC DEFAULT 0,
  marge_reelle NUMERIC DEFAULT 0,
  cout_revient NUMERIC DEFAULT 0,
  prix_vente NUMERIC DEFAULT 0,
  notes TEXT,
  date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_modification DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for products
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for devis
CREATE POLICY "Users can view their own devis" ON public.devis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own devis" ON public.devis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own devis" ON public.devis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own devis" ON public.devis FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
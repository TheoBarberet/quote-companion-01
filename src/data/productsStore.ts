import { supabase } from '@/integrations/supabase/client';
import type { Composant, MatierePremiere, EtapeProduction } from '@/types/devis';

export interface ProductTemplate {
  id: string;
  reference: string;
  designation: string;
  variantes?: string;
  quantiteOriginale: number; // Quantité enregistrée à la création
  composants: Omit<Composant, 'id'>[];
  matieresPremières: Omit<MatierePremiere, 'id'>[];
  etapesProduction: Omit<EtapeProduction, 'id'>[];
}

type Listener = () => void;
const listeners: Set<Listener> = new Set();
let cachedProducts: ProductTemplate[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export async function fetchProducts(): Promise<ProductTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur chargement produits:', error);
    return [];
  }

  cachedProducts = (data || []).map((p) => ({
    id: p.id,
    reference: p.reference,
    designation: p.designation,
    variantes: p.variantes || '',
    quantiteOriginale: (p.composants as any)?.[0]?.quantiteOriginale || 1,
    composants: ((p.composants as any[]) || []).map(({ quantiteOriginale, ...c }) => c),
    matieresPremières: (p.matieres_premieres as any[]) || [],
    etapesProduction: (p.etapes_production as any[]) || [],
  }));

  notify();
  return cachedProducts;
}

export function getProducts(): ProductTemplate[] {
  return cachedProducts;
}

export async function addProduct(product: Omit<ProductTemplate, 'id'>): Promise<ProductTemplate | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Stocker la quantité originale dans le premier composant pour la récupérer plus tard
  const composantsWithOriginal = product.composants.map((c, i) => 
    i === 0 ? { ...c, quantiteOriginale: product.quantiteOriginale } : c
  );

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      reference: product.reference,
      designation: product.designation,
      variantes: product.variantes || null,
      composants: composantsWithOriginal,
      matieres_premieres: product.matieresPremières,
      etapes_production: product.etapesProduction,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création produit:', error);
    return null;
  }

  const newProduct: ProductTemplate = {
    id: data.id,
    reference: data.reference,
    designation: data.designation,
    variantes: data.variantes || '',
    quantiteOriginale: product.quantiteOriginale,
    composants: product.composants,
    matieresPremières: product.matieresPremières,
    etapesProduction: product.etapesProduction,
  };

  cachedProducts = [newProduct, ...cachedProducts];
  notify();
  return newProduct;
}

export function subscribeProducts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Fonction pour créer un produit à partir d'un devis (si nouveau)
export async function ensureProductFromDevis(devis: {
  produit: { reference: string; designation: string; quantite: number; variantes?: string };
  composants: Composant[];
  matieresPremières: MatierePremiere[];
  etapesProduction: EtapeProduction[];
}): Promise<ProductTemplate | null> {
  const reference = devis.produit.reference?.trim();
  const designation = devis.produit.designation?.trim();
  if (!reference || !designation) return null;

  // Vérifie si le produit existe déjà
  const existing = cachedProducts.find((p) => p.reference === reference);
  if (existing) return existing;

  const quantite = Math.max(1, Number(devis.produit.quantite) || 1);

  return addProduct({
    reference,
    designation,
    variantes: devis.produit.variantes || '',
    quantiteOriginale: quantite,
    composants: devis.composants.map(({ id: _id, ...c }) => c),
    matieresPremières: devis.matieresPremières.map(({ id: _id, ...m }) => m),
    etapesProduction: devis.etapesProduction.map(({ id: _id, ...e }) => e),
  });
}

// Legacy compatibility
export function ensureProductTemplateFromDevis(devis: {
  produit: { reference: string; designation: string; quantite: number; variantes?: string };
  composants: Composant[];
  matieresPremières: MatierePremiere[];
  etapesProduction: EtapeProduction[];
}) {
  ensureProductFromDevis(devis);
}

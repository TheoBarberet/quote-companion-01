import { supabase } from '@/integrations/supabase/client';
import type { Devis, DevisStatus, Client, Composant, MatierePremiere, EtapeProduction, Transport, Marges, Produit } from '@/types/devis';

interface DbDevis {
  id: string;
  user_id: string;
  reference: string;
  status: string;
  client_reference: string | null;
  client_nom: string | null;
  client_adresse: string | null;
  client_email: string | null;
  client_telephone: string | null;
  produit: Record<string, unknown> | null;
  composants: Record<string, unknown>[] | null;
  matieres_premieres: Record<string, unknown>[] | null;
  etapes_production: Record<string, unknown>[] | null;
  transport: Record<string, unknown> | null;
  marge_cible: number | null;
  marge_reelle: number | null;
  cout_revient: number | null;
  prix_vente: number | null;
  notes: string | null;
  date_creation: string;
  date_modification: string;
  created_at: string;
  updated_at: string;
}

function mapDbToDevis(db: DbDevis): Devis {
  const clientData: Client = {
    id: db.client_reference ?? '',
    reference: db.client_reference ?? '',
    nom: db.client_nom ?? '',
    adresse: db.client_adresse ?? '',
    email: db.client_email ?? undefined,
    telephone: db.client_telephone ?? undefined,
  };

  const produitData = db.produit as unknown as Produit | null;
  const transportData = db.transport as unknown as Transport | null;

  return {
    id: db.id,
    reference: db.reference,
    dateCreation: db.date_creation,
    dateModification: db.date_modification,
    status: db.status as DevisStatus,
    creePar: 'Utilisateur',
    client: clientData,
    produit: produitData ?? { id: '', reference: '', designation: '', quantite: 0 },
    composants: (db.composants ?? []) as unknown as Composant[],
    matieresPremières: (db.matieres_premieres ?? []) as unknown as MatierePremiere[],
    etapesProduction: (db.etapes_production ?? []) as unknown as EtapeProduction[],
    transport: transportData ?? { mode: '', distance: 0, volume: 0, cout: 0 },
    marges: { margeCible: db.marge_cible ?? 0, prixVenteSouhaite: db.prix_vente ?? 0 },
    coutRevient: db.cout_revient ?? 0,
    prixVente: db.prix_vente ?? 0,
    margeReelle: db.marge_reelle ?? 0,
    notes: db.notes ?? undefined,
  };
}

export async function getDevis(): Promise<Devis[]> {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching devis:', error);
    return [];
  }

  return (data as unknown as DbDevis[]).map(mapDbToDevis);
}

export async function getDevisById(id: string): Promise<Devis | null> {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching devis:', error);
    return null;
  }

  return mapDbToDevis(data as unknown as DbDevis);
}

async function generateNextReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  const { data } = await supabase
    .from('devis')
    .select('reference')
    .like('reference', `${prefix}%`)
    .order('reference', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const match = data[0].reference.match(/DEV-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

interface DevisPayload {
  status?: DevisStatus;
  creePar?: string;
  client: Client;
  produit: Produit;
  composants: Composant[];
  matieresPremières: MatierePremiere[];
  etapesProduction: EtapeProduction[];
  transport: Transport;
  marges: Marges;
  coutRevient: number;
  prixVente: number;
  margeReelle: number;
  notes?: string;
}

export async function addDevis(payload: DevisPayload): Promise<Devis | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const reference = await generateNextReference();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('devis')
    .insert({
      user_id: user.id,
      reference,
      status: payload.status ?? 'pending',
      client_reference: payload.client?.reference || null,
      client_nom: payload.client?.nom || null,
      client_adresse: payload.client?.adresse || null,
      client_email: payload.client?.email || null,
      client_telephone: payload.client?.telephone || null,
      produit: payload.produit,
      composants: payload.composants,
      matieres_premieres: payload.matieresPremières,
      etapes_production: payload.etapesProduction,
      transport: payload.transport,
      marge_cible: payload.marges?.margeCible ?? 0,
      marge_reelle: payload.margeReelle,
      cout_revient: payload.coutRevient,
      prix_vente: payload.prixVente,
      notes: payload.notes || null,
      date_creation: today,
      date_modification: today,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error adding devis:', error);
    return null;
  }

  return mapDbToDevis(data as unknown as DbDevis);
}

export async function updateDevis(
  id: string,
  updates: Partial<DevisPayload>
): Promise<Devis | null> {
  const today = new Date().toISOString().slice(0, 10);

  const updatePayload: Record<string, unknown> = {
    date_modification: today,
  };

  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.client !== undefined) {
    updatePayload.client_reference = updates.client.reference || null;
    updatePayload.client_nom = updates.client.nom || null;
    updatePayload.client_adresse = updates.client.adresse || null;
    updatePayload.client_email = updates.client.email || null;
    updatePayload.client_telephone = updates.client.telephone || null;
  }
  if (updates.produit !== undefined) updatePayload.produit = updates.produit;
  if (updates.composants !== undefined) updatePayload.composants = updates.composants;
  if (updates.matieresPremières !== undefined) updatePayload.matieres_premieres = updates.matieresPremières;
  if (updates.etapesProduction !== undefined) updatePayload.etapes_production = updates.etapesProduction;
  if (updates.transport !== undefined) updatePayload.transport = updates.transport;
  if (updates.marges !== undefined) updatePayload.marge_cible = updates.marges.margeCible;
  if (updates.margeReelle !== undefined) updatePayload.marge_reelle = updates.margeReelle;
  if (updates.coutRevient !== undefined) updatePayload.cout_revient = updates.coutRevient;
  if (updates.prixVente !== undefined) updatePayload.prix_vente = updates.prixVente;
  if (updates.notes !== undefined) updatePayload.notes = updates.notes;

  const { data, error } = await supabase
    .from('devis')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating devis:', error);
    return null;
  }

  return mapDbToDevis(data as unknown as DbDevis);
}

export function subscribeDevis(callback: (devis: Devis[]) => void): () => void {
  // Initial fetch
  getDevis().then(callback);

  // Real-time subscription
  const channel = supabase
    .channel('devis-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'devis' },
      () => {
        getDevis().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

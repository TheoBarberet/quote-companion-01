import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  reference: string;
  nom: string;
  adresse: string;
  email?: string;
  telephone?: string;
}

interface DbClient {
  id: string;
  user_id: string;
  reference: string;
  nom: string;
  adresse: string;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToClient(db: DbClient): Client {
  return {
    id: db.id,
    reference: db.reference,
    nom: db.nom,
    adresse: db.adresse,
    email: db.email ?? undefined,
    telephone: db.telephone ?? undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return (data as DbClient[]).map(mapDbToClient);
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching client:', error);
    return null;
  }

  return mapDbToClient(data as DbClient);
}

export async function addClient(client: Omit<Client, 'id' | 'reference'>): Promise<Client | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Generate next reference
  const { data: existing } = await supabase
    .from('clients')
    .select('reference')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (existing && existing.length > 0) {
    const match = existing[0].reference.match(/CLI-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  const reference = `CLI-${String(nextNum).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      reference,
      nom: client.nom,
      adresse: client.adresse,
      email: client.email || null,
      telephone: client.telephone || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding client:', error);
    return null;
  }

  return mapDbToClient(data as DbClient);
}

export async function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'reference'>>): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      nom: updates.nom,
      adresse: updates.adresse,
      email: updates.email || null,
      telephone: updates.telephone || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    return null;
  }

  return mapDbToClient(data as DbClient);
}

export function subscribeClients(callback: (clients: Client[]) => void): () => void {
  // Initial fetch
  getClients().then(callback);

  // Real-time subscription
  const channel = supabase
    .channel('clients-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      () => {
        getClients().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Store partagé pour les clients (sera remplacé par la base de données)

export interface Client {
  id: string;
  reference: string;
  nom: string;
  adresse: string;
  email?: string;
  telephone?: string;
}

// Données initiales
let clients: Client[] = [
  { id: '1', reference: 'CLI-001', nom: 'Entreprise Martin', adresse: '12 rue de la Paix, 75001 Paris', email: 'contact@martin.fr', telephone: '01 23 45 67 89' },
  { id: '2', reference: 'CLI-002', nom: 'Société Dupont', adresse: '45 avenue des Champs, 69001 Lyon', email: 'info@dupont.com', telephone: '04 56 78 90 12' },
  { id: '3', reference: 'CLI-003', nom: 'Industries Bernard', adresse: '8 boulevard du Commerce, 33000 Bordeaux', email: 'contact@bernard-ind.fr', telephone: '05 67 89 01 23' },
  { id: '4', reference: 'CLI-004', nom: 'Tech Solutions', adresse: '22 rue de l\'Innovation, 31000 Toulouse', email: 'hello@techsolutions.fr', telephone: '05 61 23 45 67' },
  { id: '5', reference: 'CLI-005', nom: 'Groupe Lambert', adresse: '15 place du Marché, 44000 Nantes', email: 'contact@lambert-groupe.fr', telephone: '02 40 12 34 56' },
];

// Listeners pour notifier les composants des changements
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function getClients(): Client[] {
  return [...clients];
}

export function addClient(client: Omit<Client, 'id' | 'reference'>): Client {
  const newId = (Math.max(...clients.map(c => parseInt(c.id))) + 1).toString();
  const newReference = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
  
  const newClient: Client = {
    ...client,
    id: newId,
    reference: newReference,
  };
  
  clients = [...clients, newClient];
  notifyListeners();
  return newClient;
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'reference'>>): Client | null {
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  clients = clients.map(c => c.id === id ? { ...c, ...updates } : c);
  notifyListeners();
  return clients[index];
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export type DevisStatus = 'draft' | 'pending' | 'validated' | 'rejected';

export interface Client {
  id: string;
  reference: string;
  nom: string;
  adresse: string;
  email?: string;
  telephone?: string;
}

export interface Produit {
  id: string;
  reference: string;
  designation: string;
  quantite: number;
  variantes?: string;
}

export interface Composant {
  id: string;
  reference: string;
  designation: string;
  fournisseur: string;
  prixUnitaire: number;
  quantite: number;
}

export interface MatierePremiere {
  id: string;
  type: string;
  prixKg: number;
  quantiteKg: number;
}

export interface EtapeProduction {
  id: string;
  operation: string;
  dureeHeures: number;
  tauxHoraire: number;
}

export interface Transport {
  mode: string;
  distance: number;
  volume: number;
  cout: number;
}

export interface Marges {
  margeCible: number;
  prixVenteSouhaite: number;
}

export interface Devis {
  id: string;
  reference: string;
  dateCreation: string;
  dateModification: string;
  status: DevisStatus;
  creePar: string;
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

import { Devis } from '@/types/devis';

export const mockDevis: Devis[] = [
  {
    id: '1',
    reference: 'DEV-2024-001',
    dateCreation: '2024-12-10',
    dateModification: '2024-12-15',
    status: 'validated',
    creePar: 'Jean Dupont',
    client: {
      id: 'c1',
      reference: 'CLI-001',
      nom: 'Entreprise Martin SAS',
      adresse: '15 rue de l\'Industrie, 69001 Lyon',
      email: 'contact@martin-sas.fr',
      telephone: '04 78 00 00 00'
    },
    produit: {
      id: 'p1',
      reference: 'PRD-2024-A1',
      designation: 'Pièce mécanique type A',
      quantite: 500,
      variantes: 'Finition chromée'
    },
    composants: [
      { id: 'comp1', reference: 'VIS-M8', designation: 'Vis M8x25', fournisseur: 'Wurth', prixUnitaire: 0.12, quantite: 2000 },
      { id: 'comp2', reference: 'ROUL-6205', designation: 'Roulement 6205', fournisseur: 'SKF', prixUnitaire: 8.50, quantite: 500 }
    ],
    matieresPremières: [
      { id: 'mp1', type: 'Acier S235', prixKg: 1.20, quantiteKg: 250 }
    ],
    etapesProduction: [
      { id: 'ep1', operation: 'Découpe laser', dureeHeures: 8, tauxHoraire: 65 },
      { id: 'ep2', operation: 'Usinage CNC', dureeHeures: 24, tauxHoraire: 85 },
      { id: 'ep3', operation: 'Assemblage', dureeHeures: 16, tauxHoraire: 45 }
    ],
    transport: {
      mode: 'Routier',
      distance: 150,
      volume: 2.5,
      cout: 280
    },
    marges: {
      margeCible: 25,
      prixVenteSouhaite: 12500
    },
    coutRevient: 9850,
    prixVente: 12500,
    margeReelle: 26.9,
    notes: 'Client fidèle - conditions négociées'
  },
  {
    id: '2',
    reference: 'DEV-2024-002',
    dateCreation: '2024-12-12',
    dateModification: '2024-12-14',
    status: 'pending',
    creePar: 'Marie Lambert',
    client: {
      id: 'c2',
      reference: 'CLI-002',
      nom: 'Industrie Rhône-Alpes',
      adresse: '45 avenue des Usines, 38000 Grenoble',
      email: 'achats@ira.fr'
    },
    produit: {
      id: 'p2',
      reference: 'PRD-2024-B2',
      designation: 'Châssis soudé',
      quantite: 50
    },
    composants: [
      { id: 'comp3', reference: 'TUBE-40x40', designation: 'Tube carré 40x40', fournisseur: 'ArcelorMittal', prixUnitaire: 4.80, quantite: 200 }
    ],
    matieresPremières: [
      { id: 'mp2', type: 'Acier galvanisé', prixKg: 1.85, quantiteKg: 800 }
    ],
    etapesProduction: [
      { id: 'ep4', operation: 'Soudure MIG', dureeHeures: 40, tauxHoraire: 55 },
      { id: 'ep5', operation: 'Contrôle qualité', dureeHeures: 8, tauxHoraire: 50 }
    ],
    transport: {
      mode: 'Routier',
      distance: 80,
      volume: 8,
      cout: 450
    },
    marges: {
      margeCible: 20,
      prixVenteSouhaite: 8500
    },
    coutRevient: 6920,
    prixVente: 8500,
    margeReelle: 22.8
  },
  {
    id: '3',
    reference: 'DEV-2024-003',
    dateCreation: '2024-12-15',
    dateModification: '2024-12-15',
    status: 'draft',
    creePar: 'Jean Dupont',
    client: {
      id: 'c3',
      reference: 'CLI-003',
      nom: 'Tech Solutions',
      adresse: '8 parc technologique, 42000 Saint-Étienne'
    },
    produit: {
      id: 'p3',
      reference: 'PRD-2024-C3',
      designation: 'Boîtier électronique',
      quantite: 1000
    },
    composants: [],
    matieresPremières: [],
    etapesProduction: [],
    transport: {
      mode: 'Routier',
      distance: 0,
      volume: 0,
      cout: 0
    },
    marges: {
      margeCible: 30,
      prixVenteSouhaite: 0
    },
    coutRevient: 0,
    prixVente: 0,
    margeReelle: 0
  }
];

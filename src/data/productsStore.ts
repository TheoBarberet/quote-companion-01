import type { Devis, Produit, Composant, MatierePremiere, EtapeProduction } from '@/types/devis';

export interface ProductTemplate {
  produit: Omit<Produit, 'id' | 'quantite'>;
  composants: Omit<Composant, 'id'>[];
  matieresPremières: Omit<MatierePremiere, 'id'>[];
  etapesProduction: Omit<EtapeProduction, 'id'>[];
}

// Données initiales (démonstration)
let products: ProductTemplate[] = [
  {
    produit: {
      reference: 'PRD-2024-A1',
      designation: 'Pièce mécanique type A',
      variantes: 'Finition chromée',
    },
    composants: [
      {
        reference: 'VIS-M8',
        designation: 'Vis M8x25',
        fournisseur: 'Wurth',
        prixUnitaire: 0.12,
        quantite: 2000,
      },
      {
        reference: 'ROUL-6205',
        designation: 'Roulement 6205',
        fournisseur: 'SKF',
        prixUnitaire: 8.5,
        quantite: 500,
      },
    ],
    matieresPremières: [{ type: 'Acier S235', prixKg: 1.2, quantiteKg: 250 }],
    etapesProduction: [
      { operation: 'Découpe laser', dureeHeures: 8, tauxHoraire: 65 },
      { operation: 'Usinage CNC', dureeHeures: 24, tauxHoraire: 85 },
      { operation: 'Assemblage', dureeHeures: 16, tauxHoraire: 45 },
    ],
  },
  {
    produit: {
      reference: 'PRD-2024-B2',
      designation: 'Châssis soudé',
      variantes: '',
    },
    composants: [
      {
        reference: 'TUBE-40x40',
        designation: 'Tube carré 40x40',
        fournisseur: 'ArcelorMittal',
        prixUnitaire: 4.8,
        quantite: 200,
      },
    ],
    matieresPremières: [{ type: 'Acier galvanisé', prixKg: 1.85, quantiteKg: 800 }],
    etapesProduction: [
      { operation: 'Soudure MIG', dureeHeures: 40, tauxHoraire: 55 },
      { operation: 'Contrôle qualité', dureeHeures: 8, tauxHoraire: 50 },
    ],
  },
  {
    produit: {
      reference: 'PRD-2024-C3',
      designation: 'Boîtier électronique',
      variantes: 'Version IP65',
    },
    composants: [
      {
        reference: 'PCB-001',
        designation: 'Circuit imprimé principal',
        fournisseur: 'Eurocircuits',
        prixUnitaire: 12.5,
        quantite: 100,
      },
      {
        reference: 'CONN-USB',
        designation: 'Connecteur USB-C',
        fournisseur: 'Molex',
        prixUnitaire: 0.85,
        quantite: 100,
      },
      {
        reference: 'BOITIER-ABS',
        designation: 'Boîtier ABS moulé',
        fournisseur: 'Plastiform',
        prixUnitaire: 3.2,
        quantite: 100,
      },
    ],
    matieresPremières: [
      { type: 'ABS granulés', prixKg: 2.5, quantiteKg: 50 },
      { type: 'Cuivre', prixKg: 8, quantiteKg: 10 },
    ],
    etapesProduction: [
      { operation: 'Injection plastique', dureeHeures: 12, tauxHoraire: 70 },
      { operation: 'Assemblage électronique', dureeHeures: 20, tauxHoraire: 55 },
      { operation: 'Test fonctionnel', dureeHeures: 8, tauxHoraire: 45 },
    ],
  },
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

export function getProducts(): ProductTemplate[] {
  return [...products];
}

export function addProductTemplate(template: ProductTemplate): ProductTemplate {
  const exists = products.some((p) => p.produit.reference === template.produit.reference);
  if (exists) return template;

  products = [...products, template];
  notify();
  return template;
}

export function subscribeProducts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ensureProductTemplateFromDevis(
  devis: Pick<Devis, 'produit' | 'composants' | 'matieresPremières' | 'etapesProduction'>
) {
  const reference = devis.produit.reference?.trim();
  const designation = devis.produit.designation?.trim();
  if (!reference || !designation) return;

  if (products.some((p) => p.produit.reference === reference)) return;

  const q = Math.max(1, Number(devis.produit.quantite) || 1);

  addProductTemplate({
    produit: {
      reference,
      designation,
      variantes: devis.produit.variantes ?? '',
    },
    // Normalise en « base 1 unité » pour garder le recalcul proportionnel
    composants: devis.composants.map(({ id: _id, ...c }) => ({
      ...c,
      quantite: c.quantite / q,
    })),
    matieresPremières: devis.matieresPremières.map(({ id: _id, ...m }) => ({
      ...m,
      quantiteKg: m.quantiteKg / q,
    })),
    etapesProduction: devis.etapesProduction.map(({ id: _id, ...e }) => ({
      ...e,
      dureeHeures: e.dureeHeures / q,
    })),
  });
}

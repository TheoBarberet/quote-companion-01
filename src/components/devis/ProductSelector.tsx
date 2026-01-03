import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Produit, Composant, MatierePremiere, EtapeProduction } from '@/types/devis';

// Produits avec leurs composants, matières premières et étapes associés
const mockProducts: Array<{
  produit: Omit<Produit, 'id' | 'quantite'>;
  composants: Omit<Composant, 'id'>[];
  matieresPremières: Omit<MatierePremiere, 'id'>[];
  etapesProduction: Omit<EtapeProduction, 'id'>[];
}> = [
  {
    produit: {
      reference: 'PRD-2024-A1',
      designation: 'Pièce mécanique type A',
      variantes: 'Finition chromée'
    },
    composants: [
      { reference: 'VIS-M8', designation: 'Vis M8x25', fournisseur: 'Wurth', prixUnitaire: 0.12, quantite: 2000 },
      { reference: 'ROUL-6205', designation: 'Roulement 6205', fournisseur: 'SKF', prixUnitaire: 8.50, quantite: 500 }
    ],
    matieresPremières: [
      { type: 'Acier S235', prixKg: 1.20, quantiteKg: 250 }
    ],
    etapesProduction: [
      { operation: 'Découpe laser', dureeHeures: 8, tauxHoraire: 65 },
      { operation: 'Usinage CNC', dureeHeures: 24, tauxHoraire: 85 },
      { operation: 'Assemblage', dureeHeures: 16, tauxHoraire: 45 }
    ]
  },
  {
    produit: {
      reference: 'PRD-2024-B2',
      designation: 'Châssis soudé',
      variantes: ''
    },
    composants: [
      { reference: 'TUBE-40x40', designation: 'Tube carré 40x40', fournisseur: 'ArcelorMittal', prixUnitaire: 4.80, quantite: 200 }
    ],
    matieresPremières: [
      { type: 'Acier galvanisé', prixKg: 1.85, quantiteKg: 800 }
    ],
    etapesProduction: [
      { operation: 'Soudure MIG', dureeHeures: 40, tauxHoraire: 55 },
      { operation: 'Contrôle qualité', dureeHeures: 8, tauxHoraire: 50 }
    ]
  },
  {
    produit: {
      reference: 'PRD-2024-C3',
      designation: 'Boîtier électronique',
      variantes: 'Version IP65'
    },
    composants: [
      { reference: 'PCB-001', designation: 'Circuit imprimé principal', fournisseur: 'Eurocircuits', prixUnitaire: 12.50, quantite: 100 },
      { reference: 'CONN-USB', designation: 'Connecteur USB-C', fournisseur: 'Molex', prixUnitaire: 0.85, quantite: 100 },
      { reference: 'BOITIER-ABS', designation: 'Boîtier ABS moulé', fournisseur: 'Plastiform', prixUnitaire: 3.20, quantite: 100 }
    ],
    matieresPremières: [
      { type: 'ABS granulés', prixKg: 2.50, quantiteKg: 50 },
      { type: 'Cuivre', prixKg: 8.00, quantiteKg: 10 }
    ],
    etapesProduction: [
      { operation: 'Injection plastique', dureeHeures: 12, tauxHoraire: 70 },
      { operation: 'Assemblage électronique', dureeHeures: 20, tauxHoraire: 55 },
      { operation: 'Test fonctionnel', dureeHeures: 8, tauxHoraire: 45 }
    ]
  }
];

interface ProductSelectorProps {
  selectedProduct: { reference: string; designation: string; quantite: number; variantes?: string };
  onProductChange: (data: {
    produit: { reference: string; designation: string; quantite: number; variantes?: string };
    composants: Composant[];
    matieresPremières: MatierePremiere[];
    etapesProduction: EtapeProduction[];
  }) => void;
}

// Stocke les données de base (pour 1 unité) pour le calcul proportionnel
interface BaseProductData {
  composants: Omit<Composant, 'id'>[];
  matieresPremières: Omit<MatierePremiere, 'id'>[];
  etapesProduction: Omit<EtapeProduction, 'id'>[];
}

export function ProductSelector({ selectedProduct, onProductChange }: ProductSelectorProps) {
  const [isNewProduct, setIsNewProduct] = useState(!selectedProduct.reference);
  const [baseData, setBaseData] = useState<BaseProductData | null>(null);

  // Fonction pour mettre à l'échelle les données selon la quantité
  const scaleDataByQuantity = (base: BaseProductData, quantity: number) => {
    const composantsWithIds = base.composants.map((c, i) => ({
      ...c,
      id: `comp-${Date.now()}-${i}`,
      quantite: Math.round(c.quantite * quantity)
    }));
    const matieresWithIds = base.matieresPremières.map((m, i) => ({
      ...m,
      id: `mat-${Date.now()}-${i}`,
      quantiteKg: Math.round(m.quantiteKg * quantity * 100) / 100
    }));
    const etapesWithIds = base.etapesProduction.map((e, i) => ({
      ...e,
      id: `etape-${Date.now()}-${i}`,
      dureeHeures: Math.round(e.dureeHeures * quantity * 100) / 100
    }));
    return { composantsWithIds, matieresWithIds, etapesWithIds };
  };

  const handleProductSelect = (reference: string) => {
    if (reference === 'new') {
      setIsNewProduct(true);
      setBaseData(null);
      onProductChange({
        produit: { reference: '', designation: '', quantite: 1, variantes: '' },
        composants: [],
        matieresPremières: [],
        etapesProduction: []
      });
      return;
    }

    setIsNewProduct(false);
    const found = mockProducts.find(p => p.produit.reference === reference);
    if (found) {
      // Stocke les données de base pour 1 unité
      setBaseData({
        composants: found.composants,
        matieresPremières: found.matieresPremières,
        etapesProduction: found.etapesProduction
      });

      // Quantité par défaut à 1
      const quantity = 1;
      const { composantsWithIds, matieresWithIds, etapesWithIds } = scaleDataByQuantity({
        composants: found.composants,
        matieresPremières: found.matieresPremières,
        etapesProduction: found.etapesProduction
      }, quantity);

      onProductChange({
        produit: {
          reference: found.produit.reference,
          designation: found.produit.designation,
          quantite: quantity,
          variantes: found.produit.variantes
        },
        composants: composantsWithIds,
        matieresPremières: matieresWithIds,
        etapesProduction: etapesWithIds
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (baseData && !isNewProduct) {
      // Recalcule les quantités proportionnellement
      const { composantsWithIds, matieresWithIds, etapesWithIds } = scaleDataByQuantity(baseData, newQuantity);
      onProductChange({
        produit: { ...selectedProduct, quantite: newQuantity },
        composants: composantsWithIds,
        matieresPremières: matieresWithIds,
        etapesProduction: etapesWithIds
      });
    } else {
      // Nouveau produit : pas de données à mettre à l'échelle
      onProductChange({
        produit: { ...selectedProduct, quantite: newQuantity },
        composants: [],
        matieresPremières: [],
        etapesProduction: []
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Produit existant</Label>
          <Select
            value={isNewProduct ? 'new' : selectedProduct.reference || undefined}
            onValueChange={handleProductSelect}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Sélectionner un produit..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="new">+ Nouveau produit</SelectItem>
              {mockProducts.map((p) => (
                <SelectItem key={p.produit.reference} value={p.produit.reference}>
                  {p.produit.reference} - {p.produit.designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantité</Label>
          <Input
            type="number"
            min="1"
            value={selectedProduct.quantite}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            placeholder="Quantité à produire"
          />
        </div>
      </div>

      {isNewProduct && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-2">
            <Label>Référence produit</Label>
            <Input
              value={selectedProduct.reference}
              onChange={(e) => onProductChange({
                produit: { ...selectedProduct, reference: e.target.value },
                composants: [],
                matieresPremières: [],
                etapesProduction: []
              })}
              placeholder="PRD-XXX"
            />
          </div>
          <div className="space-y-2">
            <Label>Désignation</Label>
            <Input
              value={selectedProduct.designation}
              onChange={(e) => onProductChange({
                produit: { ...selectedProduct, designation: e.target.value },
                composants: [],
                matieresPremières: [],
                etapesProduction: []
              })}
              placeholder="Nom du produit"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Variantes / Options</Label>
            <Input
              value={selectedProduct.variantes || ''}
              onChange={(e) => onProductChange({
                produit: { ...selectedProduct, variantes: e.target.value },
                composants: [],
                matieresPremières: [],
                etapesProduction: []
              })}
              placeholder="Finition, couleur, etc."
            />
          </div>
        </div>
      )}

      {!isNewProduct && selectedProduct.reference && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <span className="font-medium text-foreground">Variantes :</span> {selectedProduct.variantes || 'Aucune'}
        </div>
      )}
    </div>
  );
}

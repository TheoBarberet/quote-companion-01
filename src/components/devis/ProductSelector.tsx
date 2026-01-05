import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Composant, MatierePremiere, EtapeProduction } from '@/types/devis';
import { fetchProducts, subscribeProducts, ProductTemplate } from '@/data/productsStore';

interface ProductSelectorProps {
  selectedProduct: { reference: string; designation: string; quantite: number; variantes?: string };
  onProductChange: (data: {
    produit: { reference: string; designation: string; quantite: number; variantes?: string };
    composants: Composant[];
    matieresPremières: MatierePremiere[];
    etapesProduction: EtapeProduction[];
  }) => void;
}

interface BaseProductData {
  quantiteOriginale: number;
  composants: Omit<Composant, 'id'>[];
  matieresPremières: Omit<MatierePremiere, 'id'>[];
  etapesProduction: Omit<EtapeProduction, 'id'>[];
}

export function ProductSelector({ selectedProduct, onProductChange }: ProductSelectorProps) {
  const [isNewProduct, setIsNewProduct] = useState(!selectedProduct.reference);
  const [baseData, setBaseData] = useState<BaseProductData | null>(null);
  const [products, setProducts] = useState<ProductTemplate[]>([]);

  useEffect(() => {
    // Fetch products from DB
    fetchProducts().then(setProducts);
    // Subscribe to changes
    const unsubscribe = subscribeProducts(() => {
      fetchProducts().then(setProducts);
    });
    return unsubscribe;
  }, []);

  // Scale quantities based on ratio between new quantity and original quantity
  const scaleDataByQuantity = (base: BaseProductData, newQuantity: number) => {
    const ratio = newQuantity / base.quantiteOriginale;
    
    const composantsWithIds = base.composants.map((c, i) => ({
      ...c,
      id: `comp-${Date.now()}-${i}`,
      quantite: Math.round(c.quantite * ratio)
    }));
    const matieresWithIds = base.matieresPremières.map((m, i) => ({
      ...m,
      id: `mat-${Date.now()}-${i}`,
      quantiteKg: Math.round(m.quantiteKg * ratio * 100) / 100
    }));
    const etapesWithIds = base.etapesProduction.map((e, i) => ({
      ...e,
      id: `etape-${Date.now()}-${i}`,
      dureeHeures: Math.round(e.dureeHeures * ratio * 100) / 100
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
    const found = products.find(p => p.reference === reference);
    if (found) {
      const base: BaseProductData = {
        quantiteOriginale: found.quantiteOriginale,
        composants: found.composants,
        matieresPremières: found.matieresPremières,
        etapesProduction: found.etapesProduction
      };
      setBaseData(base);

      // Use the original quantity stored in DB
      const quantity = found.quantiteOriginale;
      const { composantsWithIds, matieresWithIds, etapesWithIds } = scaleDataByQuantity(base, quantity);

      onProductChange({
        produit: {
          reference: found.reference,
          designation: found.designation,
          quantite: quantity,
          variantes: found.variantes
        },
        composants: composantsWithIds,
        matieresPremières: matieresWithIds,
        etapesProduction: etapesWithIds
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (baseData && !isNewProduct) {
      const { composantsWithIds, matieresWithIds, etapesWithIds } = scaleDataByQuantity(baseData, newQuantity);
      onProductChange({
        produit: { ...selectedProduct, quantite: newQuantity },
        composants: composantsWithIds,
        matieresPremières: matieresWithIds,
        etapesProduction: etapesWithIds
      });
    } else {
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
              {products.map((p) => (
                <SelectItem key={p.reference} value={p.reference}>
                  {p.reference} - {p.designation}
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

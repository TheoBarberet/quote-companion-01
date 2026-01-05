import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Composant, MatierePremiere, EtapeProduction } from '@/types/devis';
import { fetchProducts, subscribeProducts, ProductTemplate } from '@/data/productsStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';

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
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts().then(setProducts);
    const unsubscribe = subscribeProducts(() => {
      fetchProducts().then(setProducts);
    });
    return unsubscribe;
  }, []);

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

  const handleAISuggestions = async () => {
    if (!selectedProduct.designation.trim()) return;

    setIsLoadingAI(true);
    try {
      const quantity = Math.max(1, selectedProduct.quantite || 1);
      
      const { data, error } = await supabase.functions.invoke('ai-product-suggestions', {
        body: { 
          productDesignation: selectedProduct.designation,
          quantity,
          type: 'full'
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        const suggestions = data.suggestions;
        
        // Scale quantities by the product quantity
        const composants: Composant[] = (suggestions.composants || []).map((c: any, i: number) => ({
          id: `comp-ai-${Date.now()}-${i}`,
          reference: c.reference || `COMP-${i + 1}`,
          designation: c.designation,
          fournisseur: c.fournisseur || '',
          prixUnitaire: c.prixUnitaire || 0,
          quantite: Math.round((c.quantite || 1) * quantity),
          url: c.url || ''
        }));

        const matieresPremières: MatierePremiere[] = (suggestions.matieresPremières || []).map((m: any, i: number) => ({
          id: `mat-ai-${Date.now()}-${i}`,
          type: m.type,
          fournisseur: m.fournisseur || '',
          prixKg: m.prixKg || 0,
          quantiteKg: Math.round((m.quantiteKg || 1) * quantity * 100) / 100,
          url: m.url || ''
        }));

        const etapesProduction: EtapeProduction[] = (suggestions.etapesProduction || []).map((e: any, i: number) => ({
          id: `etape-ai-${Date.now()}-${i}`,
          operation: e.operation,
          dureeHeures: Math.round((e.dureeHeures || 1) * quantity * 100) / 100,
          tauxHoraire: e.tauxHoraire || 35
        }));

        onProductChange({
          produit: selectedProduct,
          composants,
          matieresPremières,
          etapesProduction
        });

        toast({
          title: 'Suggestions IA appliquées',
          description: `${composants.length} composants, ${matieresPremières.length} matières, ${etapesProduction.length} étapes ajoutés (pour ${quantity} unités)`,
        });
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les suggestions IA',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAI(false);
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
          
          {/* AI Suggestions Button - visible only when designation has content */}
          {selectedProduct.designation.trim() && (
            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                onClick={handleAISuggestions}
                disabled={isLoadingAI}
              >
                {isLoadingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoadingAI ? 'Analyse en cours...' : 'Suggestions IA pour ce produit'}
              </Button>
            </div>
          )}

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

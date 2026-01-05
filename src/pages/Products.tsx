import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Search, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchProducts, subscribeProducts, deleteProduct, type ProductTemplate } from '@/data/productsStore';

const ITEMS_PER_PAGE = 10;

export default function Products() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductTemplate | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductTemplate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts().then(setProducts);
    const unsubscribe = subscribeProducts(() => {
      fetchProducts().then(setProducts);
    });
    return unsubscribe;
  }, []);

  const filteredProducts = products.filter(product =>
    product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (product: ProductTemplate) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (product: ProductTemplate) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      toast({
        title: "Produit supprimé",
        description: `Le produit ${productToDelete.reference} a été supprimé.`,
      });
    }
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produits</h1>
            <p className="text-muted-foreground mt-1">Catalogue des produits créés</p>
          </div>
        </div>

        {/* Search */}
        <div className="section-card mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par désignation ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Liste des produits ({filteredProducts.length})</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="hidden md:table-cell">Variantes</TableHead>
                  <TableHead className="hidden lg:table-cell">Composants</TableHead>
                  <TableHead className="hidden lg:table-cell">Matières</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.reference}</TableCell>
                    <TableCell className="font-medium">{product.designation}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.variantes || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {product.composants.length}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {product.matieresPremières.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(product)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Référence</Label>
                  <p className="font-mono">{selectedProduct.reference}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Désignation</Label>
                  <p className="font-medium">{selectedProduct.designation}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Variantes</Label>
                <p>{selectedProduct.variantes || '-'}</p>
              </div>

              {/* Composants */}
              <div>
                <Label className="text-muted-foreground">Composants ({selectedProduct.composants.length})</Label>
                {selectedProduct.composants.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedProduct.composants.map((comp, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">{comp.designation}</span>
                        <span className="text-muted-foreground ml-2">
                          - {comp.quantite} × {comp.prixUnitaire}€
                        </span>
                        {comp.fournisseur && (
                          <span className="text-muted-foreground ml-2">({comp.fournisseur})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun composant</p>
                )}
              </div>

              {/* Matières premières */}
              <div>
                <Label className="text-muted-foreground">Matières premières ({selectedProduct.matieresPremières.length})</Label>
                {selectedProduct.matieresPremières.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedProduct.matieresPremières.map((mat, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">{mat.type}</span>
                        <span className="text-muted-foreground ml-2">
                          - {mat.quantiteKg} kg × {mat.prixKg}€/kg
                        </span>
                        {mat.fournisseur && (
                          <span className="text-muted-foreground ml-2">({mat.fournisseur})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune matière première</p>
                )}
              </div>

              {/* Étapes de production */}
              <div>
                <Label className="text-muted-foreground">Étapes de production ({selectedProduct.etapesProduction.length})</Label>
                {selectedProduct.etapesProduction.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedProduct.etapesProduction.map((etape, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">{etape.operation}</span>
                        <span className="text-muted-foreground ml-2">
                          - {etape.dureeHeures}h × {etape.tauxHoraire}€/h
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune étape de production</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer le produit <strong>{productToDelete?.reference}</strong> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

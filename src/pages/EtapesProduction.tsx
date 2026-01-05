import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EtapeProduction {
  id: string;
  operation: string;
  taux_horaire: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function EtapesProduction() {
  const [etapes, setEtapes] = useState<EtapeProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOperation, setNewOperation] = useState('');
  const [newTauxHoraire, setNewTauxHoraire] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchEtapes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('etapes_production_catalogue')
      .select('*')
      .order('operation', { ascending: true });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les étapes', variant: 'destructive' });
    } else {
      setEtapes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEtapes();
  }, []);

  const handleAddEtape = async () => {
    if (!newOperation.trim()) {
      toast({ title: 'Erreur', description: 'Le nom de l\'opération est requis', variant: 'destructive' });
      return;
    }

    const tauxHoraire = parseFloat(newTauxHoraire) || 0;

    const { error } = await supabase
      .from('etapes_production_catalogue')
      .insert({ operation: newOperation.trim(), taux_horaire: tauxHoraire });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Erreur', description: 'Cette opération existe déjà', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: 'Impossible d\'ajouter l\'étape', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Succès', description: 'Étape ajoutée avec succès' });
      setNewOperation('');
      setNewTauxHoraire('');
      fetchEtapes();
    }
  };

  const handleDeleteEtape = async (id: string) => {
    const { error } = await supabase
      .from('etapes_production_catalogue')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'étape', variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Étape supprimée' });
      fetchEtapes();
    }
  };

  const filteredEtapes = etapes.filter(e =>
    e.operation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredEtapes.length / ITEMS_PER_PAGE);
  const paginatedEtapes = filteredEtapes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Étapes de production</h1>
            <p className="text-muted-foreground">Catalogue des opérations et taux horaires</p>
          </div>
        </div>

        {/* Add new step */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Nouvelle opération</label>
                <Input
                  placeholder="Nom de l'opération"
                  value={newOperation}
                  onChange={(e) => setNewOperation(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">Taux horaire (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newTauxHoraire}
                  onChange={(e) => setNewTauxHoraire(e.target.value)}
                />
              </div>
              <Button onClick={handleAddEtape} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une opération..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liste des opérations ({filteredEtapes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opération</TableHead>
                  <TableHead className="text-right">Taux horaire (€/h)</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedEtapes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Aucune étape trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEtapes.map((etape) => (
                    <TableRow key={etape.id}>
                      <TableCell className="font-medium">{etape.operation}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {etape.taux_horaire.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEtape(etape.id)}
                          className="text-destructive hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EtapeProduction {
  id: string;
  operation: string;
  taux_horaire: number;
  created_at: string;
}

export default function EtapesProduction() {
  const [etapes, setEtapes] = useState<EtapeProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOperation, setNewOperation] = useState('');
  const [newTauxHoraire, setNewTauxHoraire] = useState('');
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogue des étapes de production</h1>
          <p className="text-muted-foreground">Gérez les opérations disponibles et leurs taux horaires</p>
        </div>

        {/* Ajout d'une nouvelle étape */}
        <div className="flex gap-4 items-end p-4 bg-card rounded-lg border">
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
          <Button onClick={handleAddEtape}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une opération..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tableau */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opération</TableHead>
                <TableHead className="w-40 text-right">Taux horaire (€/h)</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredEtapes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Aucune étape trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredEtapes.map((etape) => (
                  <TableRow key={etape.id}>
                    <TableCell className="font-medium">{etape.operation}</TableCell>
                    <TableCell className="text-right">{etape.taux_horaire.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEtape(etape.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredEtapes.length} opération{filteredEtapes.length > 1 ? 's' : ''} dans le catalogue
        </p>
      </div>
    </AppLayout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DevisTable } from '@/components/devis/DevisTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockDevis } from '@/data/mockDevis';
import { Plus, Search, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDevis = mockDevis.filter((d) => {
    const matchesSearch = 
      d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.produit.designation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockDevis.length,
    draft: mockDevis.filter(d => d.status === 'draft').length,
    pending: mockDevis.filter(d => d.status === 'pending').length,
    validated: mockDevis.filter(d => d.status === 'validated').length,
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">Gérez et suivez vos devis</p>
          </div>
          <Button onClick={() => navigate('/devis/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau devis
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="section-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total devis</p>
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Brouillons</p>
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.validated}</p>
                <p className="text-sm text-muted-foreground">Validés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="section-card mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un devis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="section-card">
          {filteredDevis.length > 0 ? (
            <DevisTable devis={filteredDevis} />
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun devis trouvé</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

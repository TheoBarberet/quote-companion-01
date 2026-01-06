import { Devis } from '@/types/devis';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Eye, Copy, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DevisTableProps {
  devis: Devis[];
}

export function DevisTable({ devis }: DevisTableProps) {
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>Produit</th>
            <th>Date création</th>
            <th>Statut</th>
            <th>Prix de vente</th>
            <th>Marge</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devis.map((d) => (
            <tr key={d.id} className="cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
              <td className="font-medium">{d.reference}</td>
              <td>{d.client.nom}</td>
              <td>{d.produit.designation}</td>
              <td className="text-muted-foreground">{formatDate(d.dateCreation)}</td>
              <td><StatusBadge status={d.status} /></td>
              <td className="font-medium">{formatCurrency(d.prixVente)}</td>
              <td className={d.margeReelle >= d.marges.margeCible ? 'text-success' : 'text-warning'}>
                {d.margeReelle.toFixed(1)}%
              </td>
              <td className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/devis/${d.id}`)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/devis/${d.id}/edit`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/devis/new', { 
                      state: { 
                        duplicateFrom: {
                          client: d.client,
                          produit: d.produit,
                          composants: d.composants,
                          matieresPremières: d.matieresPremières,
                          etapesProduction: d.etapesProduction,
                          transport: d.transport,
                          marges: d.marges,
                          notes: d.notes
                        }
                      } 
                    })}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

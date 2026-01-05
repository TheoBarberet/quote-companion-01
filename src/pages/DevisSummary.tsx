import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/devis/StatusBadge';
import type { Devis } from '@/types/devis';
import { addDevis, getDevisById, updateDevis } from '@/data/devisStore';
import { ensureProductTemplateFromDevis } from '@/data/productsStore';
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DevisSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const draftDevis = location.state?.draftDevis as Devis | undefined;
  const isDraft = id === 'new' || Boolean(draftDevis && id === 'new');

  const [devis, setDevis] = useState<Devis | null>(draftDevis || null);
  const [loading, setLoading] = useState(!draftDevis && !!id && id !== 'new');

  useEffect(() => {
    if (!draftDevis && id && id !== 'new') {
      getDevisById(id).then((data) => {
        setDevis(data);
        setLoading(false);
      });
    }
  }, [id, draftDevis]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Export ${format.toUpperCase()}`,
      description: 'Le fichier a été généré avec succès',
    });
  };

  const handleValidate = async () => {
    if (!devis) return;

    // Si on vient de /devis/new/summary : on crée réellement le devis au moment de la validation
    if (id === 'new') {
      ensureProductTemplateFromDevis(devis);

      const created = await addDevis({
        status: 'validated',
        creePar: devis.creePar,
        client: devis.client,
        produit: devis.produit,
        composants: devis.composants,
        matieresPremières: devis.matieresPremières,
        etapesProduction: devis.etapesProduction,
        transport: devis.transport,
        marges: devis.marges,
        coutRevient: devis.coutRevient,
        prixVente: devis.prixVente,
        margeReelle: devis.margeReelle,
        notes: devis.notes,
      });

      toast({
        title: 'Devis validé',
        description: `Le devis ${created?.reference || ''} a été créé et envoyé.`,
      });
      navigate('/dashboard');
      return;
    }

    // Devis existant : on le passe en validé
    ensureProductTemplateFromDevis(devis);
    await updateDevis(devis.id, {
      status: 'validated',
      creePar: devis.creePar,
      client: devis.client,
      produit: devis.produit,
      composants: devis.composants,
      matieresPremières: devis.matieresPremières,
      etapesProduction: devis.etapesProduction,
      transport: devis.transport,
      marges: devis.marges,
      coutRevient: devis.coutRevient,
      prixVente: devis.prixVente,
      margeReelle: devis.margeReelle,
      notes: devis.notes,
    });

    toast({
      title: 'Devis validé',
      description: 'Le devis a été envoyé pour approbation',
    });
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 animate-fade-in">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!devis) {
    return (
      <AppLayout>
        <div className="p-8 animate-fade-in">
          <div className="section-card">
            <p className="text-muted-foreground">Aucun devis à afficher.</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/dashboard')}>Retour au tableau de bord</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const margeOk = devis.margeReelle >= devis.marges.margeCible;

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(isDraft ? '/devis/new' : `/devis/${id}/edit`, {
                state: isDraft ? { draftDevis: devis } : undefined,
              })
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au formulaire
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{devis.reference}</h1>
              <StatusBadge status={devis.status} />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigate(isDraft ? '/devis/new' : `/devis/${id}/edit`, {
                state: isDraft ? { draftDevis: devis } : undefined,
              })
            }
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button onClick={handleValidate}>
            <Send className="w-4 h-4 mr-2" />
            Valider et envoyer
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Alert */}
            {!margeOk && (
              <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Attention : marge insuffisante</p>
                  <p className="text-sm text-muted-foreground">
                    La marge réelle ({devis.margeReelle.toFixed(1)}%) est inférieure à la marge cible ({devis.marges.margeCible}%)
                  </p>
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="section-card">
              <h2 className="font-semibold text-lg mb-4">Informations client</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{devis.client.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{devis.client.reference}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">{devis.client.adresse}</p>
                </div>
              </div>
            </div>

            {/* Product */}
            <div className="section-card">
              <h2 className="font-semibold text-lg mb-4">Produit</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Référence</p>
                  <p className="font-medium">{devis.produit.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Désignation</p>
                  <p className="font-medium">{devis.produit.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantité</p>
                  <p className="font-medium">{devis.produit.quantite} unités</p>
                </div>
              </div>
            </div>

            {/* Détail des coûts */}
            <div className="section-card">
              <h2 className="font-semibold text-lg mb-4">Détail des coûts</h2>
              
              {/* Composants */}
              {devis.composants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Composants</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Désignation</th>
                        <th>Fournisseur</th>
                        <th className="text-right">Prix unit.</th>
                        <th className="text-right">Qté</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devis.composants.map((c) => (
                        <tr key={c.id}>
                          <td>{c.reference}</td>
                          <td>{c.designation}</td>
                          <td>{c.fournisseur}</td>
                          <td className="text-right">{formatCurrency(c.prixUnitaire)}</td>
                          <td className="text-right">{c.quantite}</td>
                          <td className="text-right font-medium">{formatCurrency(c.prixUnitaire * c.quantite)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matières premières */}
              {devis.matieresPremières.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Matières premières</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th className="text-right">Prix/kg</th>
                        <th className="text-right">Quantité (kg)</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devis.matieresPremières.map((m) => (
                        <tr key={m.id}>
                          <td>{m.type}</td>
                          <td className="text-right">{formatCurrency(m.prixKg)}</td>
                          <td className="text-right">{m.quantiteKg}</td>
                          <td className="text-right font-medium">{formatCurrency(m.prixKg * m.quantiteKg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Production */}
              {devis.etapesProduction.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Production</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Opération</th>
                        <th className="text-right">Durée (h)</th>
                        <th className="text-right">Taux horaire</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devis.etapesProduction.map((e) => (
                        <tr key={e.id}>
                          <td>{e.operation}</td>
                          <td className="text-right">{e.dureeHeures}</td>
                          <td className="text-right">{formatCurrency(e.tauxHoraire)}</td>
                          <td className="text-right font-medium">{formatCurrency(e.dureeHeures * e.tauxHoraire)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transport */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Transport</h3>
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Mode</p>
                    <p className="font-medium">{devis.transport.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-medium">{devis.transport.distance} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-medium">{devis.transport.volume} m³</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coût</p>
                    <p className="font-medium">{formatCurrency(devis.transport.cout)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="section-card sticky top-8">
              <h3 className="font-semibold text-lg mb-4">Synthèse financière</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Coût de revient</p>
                  <p className="text-2xl font-bold">{formatCurrency(devis.coutRevient)}</p>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary">Prix de vente</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(devis.prixVente)}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Marge cible</span>
                    <span className="font-medium">{devis.marges.margeCible}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Marge réelle</span>
                    <div className="flex items-center gap-2">
                      {margeOk ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                      <span className={`text-lg font-bold ${margeOk ? 'text-success' : 'text-warning'}`}>
                        {devis.margeReelle.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bénéfice</span>
                    <span className="font-semibold">{formatCurrency(devis.prixVente - devis.coutRevient)}</span>
                  </div>
                </div>
              </div>

              {devis.notes && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{devis.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Devis } from '@/types/devis';
import { addDevis, getDevisById, updateDevis } from '@/data/devisStore';
import { ensureProductTemplateFromDevis } from '@/data/productsStore';
import { addClient } from '@/data/clientsStore';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
  User,
  Package,
  Puzzle,
  Layers,
  Factory,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExcelImportButton } from '@/components/devis/ExcelImportButton';
import { ClientSelector } from '@/components/devis/ClientSelector';
import { ProductSelector } from '@/components/devis/ProductSelector';

export default function DevisForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isEditing = Boolean(id && id !== 'new');

  // Récupère le client pré-rempli depuis la navigation (depuis la page Clients)
  const prefilledClient = location.state?.prefilledClient;

  // Récupère un brouillon depuis la page synthèse (/devis/new/summary)
  const draftDevis = location.state?.draftDevis as Devis | undefined;

  const [existingDevis, setExistingDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    client: prefilledClient || draftDevis?.client || { id: '', reference: '', nom: '', adresse: '', email: '', telephone: '' },
    produit: draftDevis?.produit || { id: '', reference: '', designation: '', quantite: 0, variantes: '' },
    composants: draftDevis?.composants || [],
    matieresPremières: draftDevis?.matieresPremières || [],
    etapesProduction: draftDevis?.etapesProduction || [],
    transport: draftDevis?.transport || { mode: 'Routier', distance: 0, volume: 0, cout: 0 },
    marges: draftDevis?.marges || { margeCible: 25, prixVenteSouhaite: 0 },
    notes: draftDevis?.notes || '',
  });

  useEffect(() => {
    if (isEditing && id) {
      getDevisById(id).then((devis) => {
        if (devis) {
          setExistingDevis(devis);
          setFormData({
            client: devis.client,
            produit: devis.produit,
            composants: devis.composants,
            matieresPremières: devis.matieresPremières,
            etapesProduction: devis.etapesProduction,
            transport: devis.transport,
            marges: devis.marges,
            notes: devis.notes || '',
          });
        }
        setLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleSave = async (coutRevient: number) => {
    const prixVente = formData.marges.prixVenteSouhaite || 0;
    const margeReelle =
      prixVente > 0 ? ((prixVente - coutRevient) / prixVente) * 100 : 0;

    // Si nouveau client (pas d'id existant), le créer en BDD
    let clientId = formData.client.id;
    let clientReference = formData.client.reference;
    if (!clientId && formData.client.nom) {
      const newClient = await addClient({
        nom: formData.client.nom,
        adresse: formData.client.adresse || '',
        email: formData.client.email || undefined,
        telephone: formData.client.telephone || undefined,
      });
      if (newClient) {
        clientId = newClient.id;
        clientReference = newClient.reference;
      }
    }

    const produitId = formData.produit.id || crypto.randomUUID();

    const payload = {
      status: existingDevis?.status ?? ('pending' as const),
      creePar: existingDevis?.creePar ?? 'Utilisateur',
      client: { ...formData.client, id: clientId || '', reference: clientReference || '' },
      produit: {
        ...formData.produit,
        id: produitId,
        quantite: Math.max(1, Number(formData.produit.quantite) || 1),
      },
      composants: formData.composants,
      matieresPremières: formData.matieresPremières,
      etapesProduction: formData.etapesProduction,
      transport: formData.transport,
      marges: formData.marges,
      coutRevient,
      prixVente,
      margeReelle,
      notes: formData.notes,
    };

    ensureProductTemplateFromDevis({
      produit: payload.produit,
      composants: payload.composants,
      matieresPremières: payload.matieresPremières,
      etapesProduction: payload.etapesProduction,
    });

    let result;
    if (existingDevis) {
      result = await updateDevis(existingDevis.id, payload);
    } else {
      result = await addDevis(payload);
    }

    if (!result) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le devis. Veuillez vous reconnecter.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Devis enregistré',
      description: existingDevis
        ? 'Les modifications ont été sauvegardées'
        : 'Le nouveau devis a été créé',
    });

    navigate('/dashboard');
  };

  const addComposant = () => {
    setFormData(prev => ({
      ...prev,
      composants: [...prev.composants, { id: Date.now().toString(), reference: '', designation: '', fournisseur: '', prixUnitaire: 0, quantite: 0 }]
    }));
  };

  const addMatiere = () => {
    setFormData(prev => ({
      ...prev,
      matieresPremières: [...prev.matieresPremières, { id: Date.now().toString(), type: '', prixKg: 0, quantiteKg: 0 }]
    }));
  };

  const addEtape = () => {
    setFormData(prev => ({
      ...prev,
      etapesProduction: [...prev.etapesProduction, { id: Date.now().toString(), operation: '', dureeHeures: 0, tauxHoraire: 0 }]
    }));
  };

  const removeItem = (type: 'composants' | 'matieresPremières' | 'etapesProduction', itemId: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((item: { id: string }) => item.id !== itemId)
    }));
  };

  // Calculs
  const totalComposants = formData.composants.reduce((sum, c) => sum + (c.prixUnitaire * c.quantite), 0);
  const totalMatieres = formData.matieresPremières.reduce((sum, m) => sum + (m.prixKg * m.quantiteKg), 0);
  const totalProduction = formData.etapesProduction.reduce((sum, e) => sum + (e.dureeHeures * e.tauxHoraire), 0);
  const coutRevient = totalComposants + totalMatieres + totalProduction + formData.transport.cout;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 animate-fade-in">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {existingDevis ? `Modifier ${existingDevis.reference}` : 'Nouveau devis'}
            </h1>
          </div>
          <ExcelImportButton
            onDataExtracted={(data) => {
              setFormData((prev) => ({
                ...prev,
                client: { ...prev.client, ...data.client },
                produit: { ...prev.produit, ...data.produit },
              }));
            }}
          />
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Suggestions IA
          </Button>
          <Button onClick={() => handleSave(coutRevient)}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="col-span-2 space-y-6">
            {/* Client */}
            <div className="section-card">
              <div className="form-section-title">
                <User className="w-4 h-4" />
                Informations client
              </div>
              <ClientSelector
                selectedClient={formData.client}
                onClientChange={(client) => setFormData(prev => ({ ...prev, client: { ...prev.client, ...client } }))}
              />
              <div className="mt-4 space-y-2">
                <Label>Adresse</Label>
                <Textarea 
                  value={formData.client.adresse}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, adresse: e.target.value }}))}
                  placeholder="Adresse complète"
                  rows={2}
                />
              </div>
            </div>

            {/* Produit */}
            <div className="section-card">
              <div className="form-section-title">
                <Package className="w-4 h-4" />
                Produit / Projet
              </div>
              <ProductSelector
                selectedProduct={formData.produit}
                onProductChange={(data) => {
                  setFormData(prev => ({
                    ...prev,
                    produit: { ...prev.produit, ...data.produit },
                    ...(data.composants.length > 0 && { composants: data.composants }),
                    ...(data.matieresPremières.length > 0 && { matieresPremières: data.matieresPremières }),
                    ...(data.etapesProduction.length > 0 && { etapesProduction: data.etapesProduction })
                  }));
                }}
              />
            </div>

            {/* Composants */}
            <div className="section-card">
              <div className="flex items-center justify-between mb-4">
                <div className="form-section-title mb-0">
                  <Puzzle className="w-4 h-4" />
                  Composants
                </div>
                <Button variant="outline" size="sm" onClick={addComposant}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {formData.composants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun composant ajouté</p>
              ) : (
                <div className="space-y-3">
                  {formData.composants.map((comp, idx) => (
                    <div key={comp.id} className="grid grid-cols-6 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Référence</Label>
                        <Input 
                          value={comp.reference}
                          onChange={(e) => {
                            const updated = [...formData.composants];
                            updated[idx].reference = e.target.value;
                            setFormData(prev => ({ ...prev, composants: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Désignation</Label>
                        <Input 
                          value={comp.designation}
                          onChange={(e) => {
                            const updated = [...formData.composants];
                            updated[idx].designation = e.target.value;
                            setFormData(prev => ({ ...prev, composants: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fournisseur</Label>
                        <Input 
                          value={comp.fournisseur}
                          onChange={(e) => {
                            const updated = [...formData.composants];
                            updated[idx].fournisseur = e.target.value;
                            setFormData(prev => ({ ...prev, composants: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prix unit. (€)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={comp.prixUnitaire}
                          onChange={(e) => {
                            const updated = [...formData.composants];
                            updated[idx].prixUnitaire = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, composants: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantité</Label>
                        <Input 
                          type="number"
                          value={comp.quantite}
                          onChange={(e) => {
                            const updated = [...formData.composants];
                            updated[idx].quantite = parseInt(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, composants: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('composants', comp.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Matières premières */}
            <div className="section-card">
              <div className="flex items-center justify-between mb-4">
                <div className="form-section-title mb-0">
                  <Layers className="w-4 h-4" />
                  Matières premières
                </div>
                <Button variant="outline" size="sm" onClick={addMatiere}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {formData.matieresPremières.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune matière première ajoutée</p>
              ) : (
                <div className="space-y-3">
                  {formData.matieresPremières.map((mat, idx) => (
                    <div key={mat.id} className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Type de matière</Label>
                        <Input 
                          value={mat.type}
                          onChange={(e) => {
                            const updated = [...formData.matieresPremières];
                            updated[idx].type = e.target.value;
                            setFormData(prev => ({ ...prev, matieresPremières: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prix / kg (€)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={mat.prixKg}
                          onChange={(e) => {
                            const updated = [...formData.matieresPremières];
                            updated[idx].prixKg = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, matieresPremières: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantité (kg)</Label>
                        <Input 
                          type="number"
                          value={mat.quantiteKg}
                          onChange={(e) => {
                            const updated = [...formData.matieresPremières];
                            updated[idx].quantiteKg = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, matieresPremières: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('matieresPremières', mat.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Étapes de production */}
            <div className="section-card">
              <div className="flex items-center justify-between mb-4">
                <div className="form-section-title mb-0">
                  <Factory className="w-4 h-4" />
                  Étapes de production
                </div>
                <Button variant="outline" size="sm" onClick={addEtape}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {formData.etapesProduction.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune étape de production ajoutée</p>
              ) : (
                <div className="space-y-3">
                  {formData.etapesProduction.map((etape, idx) => (
                    <div key={etape.id} className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Opération</Label>
                        <Input 
                          value={etape.operation}
                          onChange={(e) => {
                            const updated = [...formData.etapesProduction];
                            updated[idx].operation = e.target.value;
                            setFormData(prev => ({ ...prev, etapesProduction: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Durée (h)</Label>
                        <Input 
                          type="number"
                          value={etape.dureeHeures}
                          onChange={(e) => {
                            const updated = [...formData.etapesProduction];
                            updated[idx].dureeHeures = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, etapesProduction: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Taux horaire (€)</Label>
                        <Input 
                          type="number"
                          value={etape.tauxHoraire}
                          onChange={(e) => {
                            const updated = [...formData.etapesProduction];
                            updated[idx].tauxHoraire = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, etapesProduction: updated }));
                          }}
                          className="h-9"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('etapesProduction', etape.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transport */}
            <div className="section-card">
              <div className="form-section-title">
                <Truck className="w-4 h-4" />
                Transport
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Mode de transport</Label>
                  <Select 
                    value={formData.transport.mode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transport: { ...prev.transport, mode: value }}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routier">Routier</SelectItem>
                      <SelectItem value="Maritime">Maritime</SelectItem>
                      <SelectItem value="Aérien">Aérien</SelectItem>
                      <SelectItem value="Ferroviaire">Ferroviaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input 
                    type="number"
                    value={formData.transport.distance}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport: { ...prev.transport, distance: parseFloat(e.target.value) || 0 }}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume (m³)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={formData.transport.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport: { ...prev.transport, volume: parseFloat(e.target.value) || 0 }}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coût transport (€)</Label>
                  <Input 
                    type="number"
                    value={formData.transport.cout}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport: { ...prev.transport, cout: parseFloat(e.target.value) || 0 }}))}
                  />
                </div>
              </div>
            </div>

            {/* Marges */}
            <div className="section-card">
              <div className="form-section-title">
                <TrendingUp className="w-4 h-4" />
                Marges et prix
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marge cible (%)</Label>
                  <Input 
                    type="number"
                    value={formData.marges.margeCible}
                    onChange={(e) => setFormData(prev => ({ ...prev, marges: { ...prev.marges, margeCible: parseFloat(e.target.value) || 0 }}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix de vente souhaité (€)</Label>
                  <Input 
                    type="number"
                    value={formData.marges.prixVenteSouhaite}
                    onChange={(e) => setFormData(prev => ({ ...prev, marges: { ...prev.marges, prixVenteSouhaite: parseFloat(e.target.value) || 0 }}))}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="section-card">
              <div className="space-y-2">
                <Label>Notes / Commentaires</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="section-card sticky top-8">
              <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Composants</span>
                  <span className="font-medium">{totalComposants.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matières premières</span>
                  <span className="font-medium">{totalMatieres.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Production</span>
                  <span className="font-medium">{totalProduction.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transport</span>
                  <span className="font-medium">{formData.transport.cout.toFixed(2)} €</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Coût de revient</span>
                    <span className="font-bold">{coutRevient.toFixed(2)} €</span>
                  </div>
                </div>
                {formData.marges.prixVenteSouhaite > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix de vente</span>
                      <span className="font-medium">{formData.marges.prixVenteSouhaite.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marge réelle</span>
                      <span className={`font-medium ${
                        coutRevient > 0 
                          ? ((formData.marges.prixVenteSouhaite - coutRevient) / formData.marges.prixVenteSouhaite * 100) >= formData.marges.margeCible
                            ? 'text-success'
                            : 'text-warning'
                          : ''
                      }`}>
                        {coutRevient > 0 
                          ? ((formData.marges.prixVenteSouhaite - coutRevient) / formData.marges.prixVenteSouhaite * 100).toFixed(1) 
                          : '0'}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full mt-6"
                onClick={() => {
                  const prixVente = formData.marges.prixVenteSouhaite || 0;
                  const margeReelle =
                    prixVente > 0
                      ? ((prixVente - coutRevient) / prixVente) * 100
                      : 0;

                  const draft: Devis = {
                    id: existingDevis?.id ?? 'new',
                    reference: existingDevis?.reference ?? 'Nouveau devis',
                    dateCreation:
                      existingDevis?.dateCreation ?? new Date().toISOString().slice(0, 10),
                    dateModification: new Date().toISOString().slice(0, 10),
                    status: existingDevis?.status ?? 'draft',
                    creePar: existingDevis?.creePar ?? 'Utilisateur',
                    client: {
                      ...formData.client,
                      id: formData.client.id || crypto.randomUUID(),
                    },
                    produit: {
                      ...formData.produit,
                      id: formData.produit.id || crypto.randomUUID(),
                    },
                    composants: formData.composants,
                    matieresPremières: formData.matieresPremières,
                    etapesProduction: formData.etapesProduction,
                    transport: formData.transport,
                    marges: formData.marges,
                    coutRevient,
                    prixVente,
                    margeReelle,
                    notes: formData.notes,
                  };

                  navigate(`/devis/${id || 'new'}/summary`, { state: { draftDevis: draft } });
                }}
              >
                Voir la synthèse
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

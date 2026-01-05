import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, User, Bell, Palette } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('Maji');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [companyTva, setCompanyTva] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveCompany = () => {
    toast.success('Informations entreprise sauvegardées');
  };

  const handleSavePreferences = () => {
    toast.success('Préférences sauvegardées');
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
            <p className="text-muted-foreground mt-1">Gérez vos préférences et informations</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profil utilisateur */}
          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Profil utilisateur</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Informations de votre compte</p>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>

          {/* Informations entreprise */}
          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Informations entreprise</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Ces informations apparaîtront sur vos devis</p>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nom de votre entreprise"
                  className="max-w-md"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyAddress">Adresse</Label>
                <Input
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Adresse complète"
                  className="max-w-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="companySiret">SIRET</Label>
                  <Input
                    id="companySiret"
                    value={companySiret}
                    onChange={(e) => setCompanySiret(e.target.value)}
                    placeholder="XXX XXX XXX XXXXX"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="companyTva">N° TVA</Label>
                  <Input
                    id="companyTva"
                    value={companyTva}
                    onChange={(e) => setCompanyTva(e.target.value)}
                    placeholder="FR XX XXXXXXXXX"
                  />
                </div>
              </div>
              <Button onClick={handleSaveCompany}>Sauvegarder</Button>
            </div>
          </div>

          {/* Préférences */}
          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Préférences</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Personnalisez votre expérience</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between max-w-md">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications pour les nouveaux devis
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator className="max-w-md" />
              <div className="flex items-center justify-between max-w-md">
                <div className="space-y-0.5">
                  <Label>Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le thème sombre
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <Button onClick={handleSavePreferences}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

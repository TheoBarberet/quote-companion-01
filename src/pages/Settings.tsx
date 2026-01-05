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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et informations</p>
        </div>

        <div className="grid gap-6">
          {/* Profil utilisateur */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profil utilisateur</CardTitle>
              </div>
              <CardDescription>Informations de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informations entreprise */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Informations entreprise</CardTitle>
              </div>
              <CardDescription>
                Ces informations apparaîtront sur vos devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nom de votre entreprise"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyAddress">Adresse</Label>
                <Input
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Préférences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Préférences</CardTitle>
              </div>
              <CardDescription>Personnalisez votre expérience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
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
              <Separator />
              <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

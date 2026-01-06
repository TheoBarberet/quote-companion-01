import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import majiLogo from '@/assets/maji-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

const credentialsSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe: 6 caractères minimum'),
});

type Mode = 'login' | 'signup';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname as string | undefined;
  const redirectTo = useMemo(() => from ?? '/dashboard', [from]);

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [loading, navigate, redirectTo, user]);

  const run = async (nextMode: Mode) => {
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: 'Erreur',
        description: parsed.error.issues[0]?.message ?? 'Champs invalides',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (nextMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (error) {
          toast({
            title: 'Connexion impossible',
            description:
              error.message === 'Invalid login credentials'
                ? 'Identifiants incorrects.'
                : error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({ title: 'Connexion réussie', description: 'Bienvenue sur Maji Devis' });
        navigate(redirectTo, { replace: true });
        return;
      }

      const emailRedirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        toast({
          title: 'Création de compte impossible',
          description:
            error.message === 'User already registered'
              ? 'Un compte existe déjà avec cet email. Essayez de vous connecter.'
              : error.message,
          variant: 'destructive',
        });
        return;
      }

      // Si l'auto-confirm est activé, on aura une session directement.
      if (data.session) {
        toast({ title: 'Compte créé', description: 'Vous êtes maintenant connecté.' });
        navigate(redirectTo, { replace: true });
        return;
      }

      toast({
        title: 'Compte créé',
        description:
          'Votre compte est créé. Si un email de confirmation est requis, vérifiez votre boîte mail.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <img src={majiLogo} alt="Maji" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Maji Devis</h1>
          <p className="text-muted-foreground mt-1">Connexion à l'application</p>
        </header>

        <section className="section-card">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run('login');
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email_login">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email_login"
                      type="email"
                      placeholder="nom@entreprise.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_login">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password_login"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run('signup');
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email_signup">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email_signup"
                      type="email"
                      placeholder="nom@entreprise.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_signup">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password_signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Création...' : 'Créer mon compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2025 Maji Devis - Application interne</p>
      </div>
    </div>
  );
}

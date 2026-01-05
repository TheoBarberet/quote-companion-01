import { FileText, Settings, Users, LogOut, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import majiLogo from '@/assets/maji-logo.png';
import { useAuth } from '@/contexts/auth';

const navigation = [
  { name: 'Devis', href: '/dashboard', icon: FileText },
  { name: 'Produits', href: '/products', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <aside className="w-64 bg-sidebar min-h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <img src={majiLogo} alt="Maji" className="h-8 mb-2" />
        <p className="text-xs text-sidebar-foreground/60">Maji Devis</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-foreground">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email || 'Non connecté'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }}
          className="sidebar-nav-item text-sidebar-foreground/50 hover:text-sidebar-foreground w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

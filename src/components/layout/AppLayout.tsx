import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}

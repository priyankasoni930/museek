import { Link, useLocation } from 'react-router-dom';
import { Search, Library, LogOut, Menu, Home, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [canInstall, setCanInstall] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      setIsPWA(isStandalone || isFullscreen || isMinimalUI);
    };

    checkPWA();

    const handleInstallAvailable = () => {
      setCanInstall(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    
    // Check if already installable
    if ((window as any).deferredPrompt) {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        description: "Successfully signed out",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        description: "Failed to sign out",
      });
    }
  };

  const handleInstallApp = () => {
    if ((window as any).installPWA) {
      (window as any).installPWA();
      setCanInstall(false);
    }
  };

  const SidebarContent = () => (
    <div className="h-full w-full flex flex-col">
      <nav className="space-y-4 flex-1">
        <Link
          to="/home"
          className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent ${
            location.pathname === '/home' ? 'bg-accent' : ''
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent ${
            location.pathname === '/search' ? 'bg-accent' : ''
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </Link>
        <Link
          to="/library"
          className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent ${
            location.pathname === '/library' ? 'bg-accent' : ''
          }`}
        >
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </Link>
        
        {!isPWA && (
          <button
            onClick={handleInstallApp}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent text-primary w-full text-left"
          >
            <Download className="w-5 h-5" />
            <span>Install App</span>
          </button>
        )}
      </nav>

      <div className="space-y-4">
        <ThemeToggle />
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] p-4">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="fixed top-0 left-0 h-full w-60 bg-background border-r border-border p-4 flex flex-col">
      <SidebarContent />
    </div>
  );
}

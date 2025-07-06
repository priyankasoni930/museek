import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          throw error;
        }
        
        if (!session) {
          // Clear any stale session data
          await supabase.auth.signOut();
          toast({
            description: "Please sign in to access this page",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Verify the session is still valid
        const { data: { user }, error: refreshError } = await supabase.auth.getUser();
        
        if (refreshError || !user) {
          console.error('Session refresh error:', refreshError);
          await supabase.auth.signOut();
          toast({
            description: "Your session has expired. Please sign in again",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await supabase.auth.signOut();
        toast({
          description: "Authentication error. Please sign in again",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session) {
          navigate('/');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
};
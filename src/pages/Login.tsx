
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User is already logged in, redirecting to library");
        navigate("/library");
      }
    };
    
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, redirecting to library");
        navigate("/library");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Museek
          </h1>
          <p className="text-muted-foreground text-lg">Your music, your world</p>
        </div>
        
        {/* Auth Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to continue your musical journey</p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#8b5cf6',
                    brandAccent: '#7c3aed',
                    inputBackground: 'hsl(var(--input))',
                    inputText: 'hsl(var(--foreground))',
                    inputPlaceholder: 'hsl(var(--muted-foreground))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--border))',
                    inputBorderFocus: '#8b5cf6',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                input: 'bg-input text-foreground placeholder-muted-foreground border-border hover:border-border focus:border-purple-500 rounded-xl py-3 px-4 transition-all duration-200',
                label: 'text-foreground font-medium mb-2 block',
                button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] w-full',
                anchor: 'text-purple-400 hover:text-purple-300 transition-colors duration-200',
                divider: 'border-border',
                message: 'text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3',
              },
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/library`}
          />
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            Join millions of music lovers on Museek
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

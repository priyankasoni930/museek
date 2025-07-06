
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Login from "./pages/Login";
import SharedPlaylist from "./pages/SharedPlaylist";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { supabase } from "./integrations/supabase/client";

// Root redirect component defined before use
const RootRedirect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <AudioPlayerProvider>
          <Home />
        </AudioPlayerProvider>
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/search",
    element: (
      <ProtectedRoute>
        <AudioPlayerProvider>
          <Search />
        </AudioPlayerProvider>
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/library",
    element: (
      <ProtectedRoute>
        <AudioPlayerProvider>
          <Library />
        </AudioPlayerProvider>
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/shared-playlist/:id",
    element: (
      <ProtectedRoute>
        <AudioPlayerProvider>
          <SharedPlaylist />
        </AudioPlayerProvider>
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;

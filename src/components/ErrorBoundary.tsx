import { useRouteError } from "react-router-dom";
import { Button } from "./ui/button";

export function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Oops!</h1>
        <p className="text-xl text-muted-foreground">
          Sorry, an unexpected error has occurred.
        </p>
        <p className="text-sm text-muted-foreground">
          {error?.message || "Unknown error"}
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Go back home
        </Button>
      </div>
    </div>
  );
}
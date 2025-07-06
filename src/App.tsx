
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/toaster";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Routes from "./Routes";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AudioPlayerProvider>
          <Routes />
          <Toaster />
        </AudioPlayerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

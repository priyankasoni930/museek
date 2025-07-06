import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LyricsDisplayProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lyrics: string | null;
  isLoading: boolean;
}

const LyricsDisplay = ({ isOpen, onOpenChange, lyrics, isLoading }: LyricsDisplayProps) => {
  // Split lyrics into lines
  const lyricsLines = lyrics?.split('\n').map(line => line.trim()) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Lyrics</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : lyrics ? (
            <div className="space-y-4 px-4">
              {lyricsLines.map((line, index) => (
                <p 
                  key={index}
                  className="whitespace-pre-wrap text-foreground"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No lyrics available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LyricsDisplay;
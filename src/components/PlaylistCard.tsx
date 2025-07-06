
import { Share } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
  };
  onSelect: (playlistId: string) => void;
}

export const PlaylistCard = ({ playlist, onSelect }: PlaylistCardProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/shared-playlist/${playlist.id}`);
      toast({
        description: "Playlist link copied to clipboard",
      });
    } catch (error) {
      console.error('Error sharing playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to share playlist",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-full bg-card hover:bg-accent cursor-pointer group">
      <div onClick={() => onSelect(playlist.id)} className="flex-1">
        <h3 className="font-medium">{playlist.name}</h3>
      </div>
      <Button variant="ghost" size="icon" onClick={handleShare}>
        <Share className="w-4 h-4" />
      </Button>
    </div>
  );
};

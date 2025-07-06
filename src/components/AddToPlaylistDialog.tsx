import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Plus, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddToPlaylistDialogProps {
  track: {
    id: string;
    name: string;
    artist_name: string;
    download_url: string;
    image_url: string;
    description: string;
  };
  trigger?: React.ReactNode;
}

export const AddToPlaylistDialog = ({ track, trigger }: AddToPlaylistDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
        });

      if (error) throw error;

      toast({
        description: "Song added to playlist",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to add song to playlist",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <List className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <Button
              key={playlist.id}
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => handleAddToPlaylist(playlist.id)}
            >
              <List className="w-4 h-4 mr-2" />
              {playlist.name}
            </Button>
          ))}
          {playlists.length === 0 && (
            <p className="text-center text-muted-foreground">No playlists found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
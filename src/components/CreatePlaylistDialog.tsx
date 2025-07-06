import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePlaylistDialogProps {
  onPlaylistCreated?: () => void;
}

export const CreatePlaylistDialog = ({ onPlaylistCreated }: CreatePlaylistDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const { toast } = useToast();

  const handleCreatePlaylist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          description: "You must be logged in to create a playlist",
        });
        return;
      }

      const { error } = await supabase
        .from('playlists')
        .insert({
          name: playlistName,
          user_id: session.user.id,
        });

      if (error) throw error;

      toast({
        description: "Playlist created successfully",
      });
      setIsOpen(false);
      setPlaylistName("");
      onPlaylistCreated?.();
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to create playlist",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Playlist name"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="rounded-full"
          />
          <Button onClick={handleCreatePlaylist} className="w-full rounded-full">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
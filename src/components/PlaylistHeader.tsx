import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlaylistHeaderProps {
  playlist: {
    id: string;
    name: string;
  };
  onBack: () => void;
  onDelete: () => void;
}

export const PlaylistHeader = ({ playlist, onBack, onDelete }: PlaylistHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(playlist.name);
  const { toast } = useToast();

  const handleRename = async () => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ name: newName })
        .eq('id', playlist.id);

      if (error) throw error;

      toast({
        description: "Playlist renamed successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to rename playlist",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlist.id);

      if (error) throw error;

      toast({
        description: "Playlist deleted successfully",
      });
      onDelete();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to delete playlist",
      });
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to playlists
      </button>
      
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleRename}>Save</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">{playlist.name}</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
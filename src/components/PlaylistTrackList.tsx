import { useState } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { api } from "@/lib/api";

interface PlaylistTrackListProps {
  playlistId: string;
  tracks: any[];
  onTrackClick: (track: any) => void;
  onTrackRemoved: () => void;
  isSharedView?: boolean;
}

export const PlaylistTrackList = ({ 
  playlistId, 
  tracks, 
  onTrackClick, 
  onTrackRemoved,
  isSharedView = false 
}: PlaylistTrackListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const fetchAvailableTracks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('liked_tracks')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // Filter out tracks that are already in the playlist
      const playlistTrackIds = tracks.map(t => t.track_id);
      const filteredTracks = data.filter(t => !playlistTrackIds.includes(t.track_id));
      
      setAvailableTracks(filteredTracks);
    } catch (error) {
      console.error('Error fetching available tracks:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const searchResults = await api.searchTracks(searchQuery);
      
      // Filter out tracks that are already in the playlist
      const playlistTrackIds = tracks.map(t => t.track_id);
      const filteredResults = searchResults.filter(t => !playlistTrackIds.includes(t.id));
      
      // Transform search results to match our app's format
      const formattedResults = filteredResults.map(track => ({
        track_id: track.id,
        name: track.name,
        artist_name: track.artistName,
        image_url: track.imageUrl,
        download_url: track.downloadUrl,
        description: track.description || '',
      }));
      
      setAvailableTracks(formattedResults);
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        variant: "destructive",
        description: "Failed to search for tracks",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = async (track: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          description: "Please login to add tracks to playlist",
        });
        return;
      }

      // Add the track directly to the playlist without adding to liked_tracks
      const { error: playlistError } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.track_id,
          name: track.name,
          artist_name: track.artist_name,
          image_url: track.image_url,
          download_url: track.download_url,
          description: track.description || '',
        });

      if (playlistError) throw playlistError;

      toast({
        description: "Track added to playlist",
      });
      setIsAddDialogOpen(false);
      onTrackRemoved(); // Refresh the playlist
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to add track to playlist",
      });
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      toast({
        description: "Track removed from playlist",
      });
      onTrackRemoved();
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to remove track from playlist",
      });
    }
  };

  return (
    <div className="space-y-4">
      {!isSharedView && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                fetchAvailableTracks();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tracks
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tracks to Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="rounded-full"
                />
                <Button onClick={handleSearch} disabled={isSearching} className="rounded-full">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {availableTracks.map((track) => (
                  <div
                    key={track.track_id}
                    className="flex items-center justify-between p-4 rounded-full bg-card hover:bg-accent cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={track.image_url || '/placeholder.svg'} 
                        alt={track.name} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{track.name}</h3>
                        <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => handleAddTrack(track)} className="rounded-full">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {availableTracks.length === 0 && !isSearching && (
                  <p className="text-center text-muted-foreground">
                    {searchQuery ? "No tracks found" : "Search for tracks to add"}
                  </p>
                )}
                {isSearching && (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between p-4 rounded-full bg-card hover:bg-accent cursor-pointer group"
          >
            <div className="flex items-center gap-4" onClick={() => onTrackClick(track)}>
              <img 
                src={track.image_url || '/placeholder.svg'} 
                alt={track.name} 
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{track.name}</h3>
                <p className="text-sm text-muted-foreground">{track.artist_name}</p>
              </div>
            </div>
            {!isSharedView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTrack(track.track_id);
                }}
                className="rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
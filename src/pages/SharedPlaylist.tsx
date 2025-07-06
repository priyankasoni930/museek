import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlaylistTrackList } from '@/components/PlaylistTrackList';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SharedPlaylist = () => {
  const [playlist, setPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();
  const { setCurrentTrack } = useAudioPlayer();

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      console.log('Fetching shared playlist:', id);
      
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;
      if (!playlistData) {
        toast({
          variant: "destructive",
          description: "Playlist not found",
        });
        return;
      }

      setPlaylist(playlistData);
      console.log('Fetched playlist:', playlistData);

      // Fetch playlist tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('playlist_tracks')
        .select('*')
        .eq('playlist_id', id);

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
      console.log('Fetched tracks:', tracksData);
    } catch (error) {
      console.error('Error fetching shared playlist:', error);
      toast({
        variant: "destructive",
        description: "Failed to load playlist",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track: any) => {
    if (track.download_url) {
      setCurrentTrack({
        url: track.download_url,
        id: track.track_id,
        title: track.name,
        artist: track.artist_name,
        imageUrl: track.image_url || '/placeholder.svg',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <Link to="/library" className="text-primary hover:underline">
            Go back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Link
        to="/library"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{playlist.name}</h1>
        
        <PlaylistTrackList
          playlistId={playlist.id}
          tracks={tracks}
          onTrackClick={handleTrackClick}
          onTrackRemoved={fetchPlaylist}
          isSharedView
        />
      </div>
    </div>
  );
};

export default SharedPlaylist;

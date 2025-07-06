
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { CreatePlaylistDialog } from '@/components/CreatePlaylistDialog';
import { PlaylistCard } from '@/components/PlaylistCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaylistHeader } from '@/components/PlaylistHeader';
import { PlaylistTrackList } from '@/components/PlaylistTrackList';
import { useIsMobile } from '@/hooks/use-mobile';
import { LikedSongs } from '@/components/LikedSongs';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { recentlyPlayedUtils } from '@/lib/api';

const Library = () => {
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { currentTrack, setCurrentTrack } = useAudioPlayer();

  useEffect(() => {
    fetchLikedTracks();
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistTracks(selectedPlaylist);
    }
  }, [selectedPlaylist]);

  const fetchLikedTracks = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setLoading(false);
        return;
      }

      const { data: tracks, error } = await supabase
        .from('liked_tracks')
        .select('*')
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      setLikedTracks(tracks || []);
    } catch (error) {
      console.error('Error fetching liked tracks:', error);
      toast({
        variant: "destructive",
        description: "Failed to load liked tracks",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (track: any) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          variant: "destructive",
          description: "Please login to unlike songs",
        });
        return;
      }

      const { error } = await supabase
        .from('liked_tracks')
        .delete()
        .eq('track_id', track.track_id)
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      setLikedTracks(prev => prev.filter(t => t.track_id !== track.track_id));
      
      toast({
        description: "Song removed from your library",
      });
    } catch (error) {
      console.error('Error unliking track:', error);
      toast({
        variant: "destructive",
        description: "Failed to remove song from library",
      });
    }
  };

  const fetchPlaylists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        variant: "destructive",
        description: "Failed to load playlists",
      });
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select('*')
        .eq('playlist_id', playlistId);

      if (error) throw error;
      setPlaylistTracks(data || []);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      toast({
        variant: "destructive",
        description: "Failed to load playlist tracks",
      });
    }
  };

  const selectedPlaylistData = playlists.find(p => p.id === selectedPlaylist);

  const handleTrackClick = (track: any) => {
    // Convert library track format to recently played format
    const recentlyPlayedTrack = {
      id: track.track_id,
      name: track.name,
      artistName: track.artist_name,
      imageUrl: track.image_url || '/placeholder.svg',
      downloadUrl: track.download_url,
      year: new Date().getFullYear().toString()
    };

    console.log('Saving track to recently played:', recentlyPlayedTrack); // Debug log

    // Save to recently played using the same method as home page
    recentlyPlayedUtils.saveToHomeRecentlyPlayed(recentlyPlayedTrack);

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className={`${isMobile ? 'ml-0 pt-16' : 'ml-60'} p-4 md:p-8 ${currentTrack ? 'pb-24 md:pb-32' : 'pb-8'}`}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Your Library</h1>
        
        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="justify-start mb-4 overflow-x-auto inline-flex rounded-full bg-muted">
            <TabsTrigger value="liked" className="rounded-full">Liked Songs</TabsTrigger>
            <TabsTrigger value="playlists" className="rounded-full">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className={currentTrack ? 'mb-4' : ''}>
            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4">Liked Songs</h2>
              <LikedSongs 
                tracks={likedTracks}
                onUnlike={handleUnlike}
                loading={loading}
              />
            </section>
          </TabsContent>

          <TabsContent value="playlists" className={currentTrack ? 'mb-24' : ''}>
            <section>
              {selectedPlaylist && selectedPlaylistData ? (
                <>
                  <PlaylistHeader
                    playlist={selectedPlaylistData}
                    onBack={() => setSelectedPlaylist(null)}
                    onDelete={() => {
                      setSelectedPlaylist(null);
                      fetchPlaylists();
                    }}
                  />
                  <PlaylistTrackList
                    playlistId={selectedPlaylist}
                    tracks={playlistTracks}
                    onTrackClick={handleTrackClick}
                    onTrackRemoved={() => fetchPlaylistTracks(selectedPlaylist)}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold">Your Playlists</h2>
                    <CreatePlaylistDialog onPlaylistCreated={fetchPlaylists} />
                  </div>
                  <div className="space-y-4">
                    {playlists.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onSelect={setSelectedPlaylist}
                      />
                    ))}
                    {playlists.length === 0 && (
                      <p className="text-center text-muted-foreground">No playlists yet</p>
                    )}
                  </div>
                </>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Library;

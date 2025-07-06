import { useState, useEffect } from "react";
import { api, recentlyPlayedUtils } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { Heart, Clock, Sparkles, X, Music, Radio, Star, Zap, Guitar, Piano } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Home = () => {
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [popMusic, setPopMusic] = useState<any[]>([]);
  const [rockMusic, setRockMusic] = useState<any[]>([]);
  const [rapMusic, setRapMusic] = useState<any[]>([]);
  const [jazzMusic, setJazzMusic] = useState<any[]>([]);
  const [electronicMusic, setElectronicMusic] = useState<any[]>([]);
  const [countryMusic, setCountryMusic] = useState<any[]>([]);
  const [classicalMusic, setClassicalMusic] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const { setCurrentTrack, currentTrack } = useAudioPlayer();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchHomeData();
    fetchLikedTracks();
    loadRecentlyPlayed();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [newMusic, pop, rock, rap, jazz, electronic, country, classical] = await Promise.all([
        api.getNewReleases(),
        api.searchTracks("english pop songs"),
        api.searchTracks("english rock songs"),
        api.searchTracks("english rap songs"),
        api.searchTracks("english jazz songs"),
        api.searchTracks("english electronic songs"),
        api.searchTracks("english country songs"),
        api.searchTracks("english classical songs")
      ]);
      
      setNewReleases(newMusic);
      setPopMusic(pop.slice(0, 20));
      setRockMusic(rock.slice(0, 20));
      setRapMusic(rap.slice(0, 20));
      setJazzMusic(jazz.slice(0, 20));
      setElectronicMusic(electronic.slice(0, 20));
      setCountryMusic(country.slice(0, 20));
      setClassicalMusic(classical.slice(0, 20));
    } catch (error) {
      console.error("Error fetching home data:", error);
      toast({
        variant: "destructive",
        description: "Failed to load music data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentlyPlayed = () => {
    setRecentlyPlayed(recentlyPlayedUtils.getHomeRecentlyPlayed());
  };

  const saveToRecentlyPlayed = (track: any) => {
    recentlyPlayedUtils.saveToHomeRecentlyPlayed(track);
    setRecentlyPlayed(recentlyPlayedUtils.getHomeRecentlyPlayed());
  };

  const removeFromRecentlyPlayed = (trackId: string) => {
    const updated = recentlyPlayedUtils.removeFromHomeRecentlyPlayed(trackId);
    setRecentlyPlayed(updated);
  };

  const fetchLikedTracks = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data: likes } = await supabase
        .from("liked_tracks")
        .select("track_id")
        .eq("user_id", session.session.user.id);

      if (likes) {
        setLikedTracks(new Set(likes.map((like) => like.track_id)));
      }
    } catch (error) {
      console.error("Error fetching liked tracks:", error);
    }
  };

  const handleLike = async (track: any) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast({
        variant: "destructive",
        description: "Please login to like songs",
      });
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from("liked_tracks")
        .select("id")
        .eq("track_id", track.id)
        .eq("user_id", session.session.user.id)
        .maybeSingle();

      if (existingLike) {
        toast({
          description: "This song is already in your library",
        });
        return;
      }

      const { error } = await supabase.from("liked_tracks").insert([
        {
          track_id: track.id,
          user_id: session.session.user.id,
          name: track.name,
          artist_name: track.artistName,
          description: track.description || "",
          image_url: track.imageUrl || "",
          download_url: track.downloadUrl || "",
        },
      ]);

      if (error) throw error;

      setLikedTracks((prev) => new Set([...prev, track.id]));

      toast({
        description: "Song added to your library",
      });
    } catch (error) {
      console.error("Error liking track:", error);
      toast({
        variant: "destructive",
        description: "Failed to add song to library",
      });
    }
  };

  const handleTrackClick = (track: any) => {
    saveToRecentlyPlayed(track);
    if (track.downloadUrl) {
      setCurrentTrack({
        url: track.downloadUrl,
        id: track.id,
        title: track.name,
        artist: track.artistName,
        imageUrl: track.imageUrl || '/placeholder.svg',
      });
    }
  };

  const renderTrackCard = (track: any, index: number, showRemove: boolean = false) => (
    <Card 
      key={`${track.id}-${index}`} 
      className="group bg-card hover:bg-accent transition-all duration-300 rounded-3xl border-none shadow-lg hover:shadow-xl cursor-pointer overflow-hidden flex-shrink-0 w-[160px] md:w-[200px]"
      onClick={() => handleTrackClick(track)}
    >
      <CardContent className="p-4">
        <div className="relative mb-4">
          <img
            src={track.imageUrl || "/placeholder.svg"}
            alt={track.name}
            className="w-full aspect-square object-cover rounded-2xl"
          />
          {currentTrack?.id === track.id && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
          )}
          {showRemove && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeFromRecentlyPlayed(track.id);
              }}
              className="absolute top-2 left-2 rounded-full p-1 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm truncate">{track.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{track.year}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(track);
              }}
              className="rounded-full p-1 h-8 w-8"
            >
              <Heart
                className="w-4 h-4"
                fill={likedTracks.has(track.id) ? "green" : "none"}
                color={likedTracks.has(track.id) ? "green" : "currentColor"}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection = (title: string, tracks: any[], icon: React.ReactNode, showRemove: boolean = false) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-4 p-4">
          {tracks.map((track, index) => renderTrackCard(track, index, showRemove))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className={`${isMobile ? "ml-0 pt-16" : "ml-60"} p-4 pb-24`}>
          <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className={`${isMobile ? "ml-0 pt-16" : "ml-60"} p-4 pb-24 space-y-8`}>
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Welcome to Museek
          </h1>
          <p className="text-muted-foreground">Discover trending songs, new releases, and your favorites</p>
        </div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && renderSection(
          "Recently Played",
          recentlyPlayed,
          <Clock className="w-6 h-6 text-primary" />,
          true
        )}

        {/* New Releases */}
        {newReleases.length > 0 && renderSection(
          "New Releases",
          newReleases,
          <Sparkles className="w-6 h-6 text-primary" />
        )}

        {/* Pop Music */}
        {popMusic.length > 0 && renderSection(
          "Popular Pop Hits",
          popMusic,
          <Star className="w-6 h-6 text-primary" />
        )}

        {/* Rock Music */}
        {rockMusic.length > 0 && renderSection(
          "Rock Classics",
          rockMusic,
          <Radio className="w-6 h-6 text-primary" />
        )}

        {/* Rap Music */}
        {rapMusic.length > 0 && renderSection(
          "Hip-Hop & Rap",
          rapMusic,
          <Music className="w-6 h-6 text-primary" />
        )}

        {/* Jazz Music */}
        {jazzMusic.length > 0 && renderSection(
          "Smooth Jazz",
          jazzMusic,
          <Piano className="w-6 h-6 text-primary" />
        )}

        {/* Electronic Music */}
        {electronicMusic.length > 0 && renderSection(
          "Electronic Beats",
          electronicMusic,
          <Zap className="w-6 h-6 text-primary" />
        )}

        {/* Country Music */}
        {countryMusic.length > 0 && renderSection(
          "Country Classics",
          countryMusic,
          <Guitar className="w-6 h-6 text-primary" />
        )}

        {/* Classical Music */}
        {classicalMusic.length > 0 && renderSection(
          "Classical Masterpieces",
          classicalMusic,
          <Piano className="w-6 h-6 text-primary" />
        )}

        {/* Empty State */}
        {newReleases.length === 0 && recentlyPlayed.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start Your Musical Journey</h2>
            <p className="text-muted-foreground mb-4">Search for your favorite songs and start building your library</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

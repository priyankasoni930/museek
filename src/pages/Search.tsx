
import { useState, useEffect, useRef, useCallback } from "react";
import { api, recentlyPlayedUtils } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { Heart, Search as SearchIcon, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const { setCurrentTrack, currentTrack } = useAudioPlayer();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLikedTracks();
    loadRecentlyPlayed();
  }, []);

  // Real-time search as user types
  useEffect(() => {
    if (query.trim().length > 0) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query, 1);
      }, 500);
    } else {
      setResults([]);
      setHasSearched(false);
      setPage(1);
      setHasMoreResults(true);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !loading && !loadingMore && hasSearched) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreResults, loading, loadingMore, hasSearched]);

  const loadRecentlyPlayed = () => {
    setRecentlyPlayed(recentlyPlayedUtils.getSearchRecentlyPlayed());
  };

  const saveToRecentlyPlayed = (track: any) => {
    recentlyPlayedUtils.saveToSearchRecentlyPlayed(track);
    recentlyPlayedUtils.saveToHomeRecentlyPlayed(track);
    setRecentlyPlayed(recentlyPlayedUtils.getSearchRecentlyPlayed());
  };

  const removeFromRecentlyPlayed = (trackId: string) => {
    const updated = recentlyPlayedUtils.removeFromSearchRecentlyPlayed(trackId);
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

  const handleSearch = async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    if (pageNum === 1) {
      setLoading(true);
      setResults([]);
    } else {
      setLoadingMore(true);
    }
    
    setHasSearched(true);
    
    try {
      const tracks = await api.searchTracks(searchQuery, pageNum, 20);
      
      if (pageNum === 1) {
        setResults(tracks);
        setPage(2);
      } else {
        setResults(prev => [...prev, ...tracks]);
        setPage(prev => prev + 1);
      }

      if (tracks.length < 20) {
        setHasMoreResults(false);
      }

      if (tracks.length === 0 && pageNum === 1) {
        toast({
          description: "No songs found for your search.",
        });
      }
    } catch (error) {
      console.error("Error searching tracks:", error);
      toast({
        variant: "destructive",
        description: "Failed to search for songs. Please try again.",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreResults = useCallback(() => {
    if (query.trim() && hasMoreResults && !loadingMore) {
      console.log('Loading more results for page:', page);
      handleSearch(query, page);
    }
  }, [query, page, hasMoreResults, loadingMore]);

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
    setSelectedTrack(track);
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

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSelectedTrack(null);
    setPage(1);
    setHasMoreResults(true);
    inputRef.current?.focus();
  };

  const displayTracks = hasSearched ? results : recentlyPlayed;
  const displayTitle = hasSearched ? "Search Results" : "Recently Searched";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className={`${isMobile ? "ml-0 pt-16" : "ml-60"} min-h-screen overflow-x-hidden`}>
        <div className="p-4 pb-24 max-w-full">
          {/* Search Bar */}
          <div className={`${isMobile ? "px-2" : "max-w-2xl mx-auto"} mb-8`}>
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to listen to?"
                className="w-full pl-10 pr-10 py-3 text-base rounded-full bg-secondary border-none focus:ring-2 focus:ring-primary"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-accent rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results or Recently Played */}
          {loading ? (
            <div className="flex items-center justify-center h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : displayTracks.length > 0 ? (
            <div className="space-y-1 fade-in w-full">
              <div className="flex items-center gap-2 mb-4 px-2">
                {!hasSearched && <Clock className="w-5 h-5 text-muted-foreground" />}
                <h2 className="text-xl font-semibold">{displayTitle}</h2>
              </div>
              <div className="w-full max-w-full">
                {displayTracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className={`flex items-center justify-between p-4 mx-2 mb-1 rounded-2xl bg-card hover:bg-accent cursor-pointer transition-all group w-[calc(100%-1rem)] relative ${
                      selectedTrack?.id === track.id ? "ring-2 ring-primary bg-primary/5 rounded-2xl z-10" : "z-0"
                    }`}
                  >
                    <div
                      className="flex items-center gap-4 flex-1 min-w-0"
                      onClick={() => handleTrackClick(track)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={track.imageUrl || "/placeholder.svg"}
                          alt={track.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover"
                        />
                        {selectedTrack?.id === track.id && currentTrack && (
                          <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-medium truncate text-sm sm:text-base">{track.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {track.artistName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {!hasSearched && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromRecentlyPlayed(track.id);
                          }}
                          className="h-8 w-8 rounded-full transition-opacity p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(track);
                        }}
                        className="h-8 w-8 rounded-full transition-opacity p-0"
                      >
                        <Heart
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill={likedTracks.has(track.id) ? "green" : "none"}
                          color={likedTracks.has(track.id) ? "green" : "currentColor"}
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                </div>
              )}
              
              {/* Intersection observer target */}
              {hasSearched && hasMoreResults && (
                <div ref={observerRef} className="h-10" />
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              {hasSearched ? (
                <>
                  <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-muted-foreground">
                    Try searching for something else
                  </p>
                </>
              ) : (
                <>
                  <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Search for music</h2>
                  <p className="text-muted-foreground">
                    Find your favorite songs, artists, and albums
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;


import { Heart } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { recentlyPlayedUtils } from "@/lib/api";

interface LikedSongsProps {
  tracks: any[];
  onUnlike: (track: any) => void;
  loading: boolean;
}

export const LikedSongs = ({ tracks, onUnlike, loading }: LikedSongsProps) => {
  const { currentTrack, setCurrentTrack } = useAudioPlayer();

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

    console.log('Saving track to recently played from library:', recentlyPlayedTrack);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <p className="text-center text-muted-foreground">No liked songs yet</p>
    );
  }

  return (
    <div className={`space-y-4 ${currentTrack ? 'md:pb-8 pb-16' : ''}`}>
      {tracks.map((track) => (
        <div
          key={track.id}
          className="flex items-center justify-between p-4 rounded-full bg-card hover:bg-accent cursor-pointer group"
        >
          <div
            className="flex items-center gap-4 flex-1 min-w-0"
            onClick={() => handleTrackClick(track)}
          >
            <img
              src={track.image_url || "/placeholder.svg"}
              alt={track.name}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-medium truncate">{track.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlike(track);
              }}
              className="p-2 hover:bg-accent rounded-full"
            >
              <Heart className="w-5 h-5" fill="green" color="green" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

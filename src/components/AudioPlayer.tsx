import { useState, useRef, useEffect } from 'react';
import { Slider } from './ui/slider';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import AudioControls from './AudioControls';
import LyricsDisplay from './LyricsDisplay';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import SongInfo from './SongInfo';

interface AudioPlayerProps {
  url: string | null;
  songId?: string;
  onClose: () => void;
  title?: string;
  artist?: string;
  imageUrl?: string;
}

const AudioPlayer = ({ url, songId, onClose, title, artist, imageUrl }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [url]);

  // Update loop state when component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = () => {
    if (audioRef.current) {
      const newLoopState = !isLooping;
      audioRef.current.loop = newLoopState;
      setIsLooping(newLoopState);
      console.log('Loop state changed:', newLoopState); // Debug log
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const cleanLyrics = (text: string) => {
    return text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  };

  const handleLyricsClick = async () => {
    if (!songId) {
      toast({
        variant: "destructive",
        description: "Cannot fetch lyrics: Song ID not available",
      });
      return;
    }

    setIsLoadingLyrics(true);
    setShowLyrics(true);

    try {
      const lyricsData = await api.getLyrics(songId);
      if (lyricsData) {
        setLyrics(cleanLyrics(lyricsData));
      } else {
        toast({
          variant: "destructive",
          description: "Lyrics not available for this song",
        });
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      toast({
        variant: "destructive",
        description: "Failed to fetch lyrics",
      });
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `song-${songId}.mp3`; // You can customize the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        description: "Download started successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        description: "Failed to download file",
      });
    }
  };

  const isMobile = useIsMobile();

  if (!url) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 md:p-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
          <SongInfo 
            title={title}
            artist={artist}
            imageUrl={imageUrl}
            songId={songId}
            className="w-full md:w-auto"
          />
          
          <div className="w-full md:flex-1">
            <Slider
              defaultValue={[0]}
              max={duration}
              step={0.1}
              value={[currentTime]}
              onValueChange={handleSeek}
              onValueCommit={() => setIsDragging(false)}
              onPointerDown={() => setIsDragging(true)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="mr-2"
              title="Download song"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}

          <AudioControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            isLooping={isLooping}
            onPlayPause={togglePlay}
            onMute={toggleMute}
            onLoop={toggleLoop}
            onLyrics={handleLyricsClick}
            onClose={onClose}
            songId={songId}
            isMobile={isMobile}
          />
        </div>

        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onClose}
          loop={isLooping}
        />
      </div>

      <LyricsDisplay
        isOpen={showLyrics}
        onOpenChange={setShowLyrics}
        lyrics={lyrics}
        isLoading={isLoadingLyrics}
      />
    </>
  );
};

export default AudioPlayer;
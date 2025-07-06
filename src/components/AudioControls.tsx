import { Play, Pause, Volume2, VolumeX, Repeat, BookOpen, Download } from 'lucide-react';
import { Button } from './ui/button';

interface AudioControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isLooping: boolean;
  onPlayPause: () => void;
  onMute: () => void;
  onLoop: () => void;
  onLyrics: () => void;
  onClose: () => void;
  songId?: string;
  isMobile?: boolean;
}

const AudioControls = ({
  isPlaying,
  isMuted,
  isLooping,
  onPlayPause,
  onMute,
  onLoop,
  onLyrics,
  onClose,
  songId,
  isMobile
}: AudioControlsProps) => {
  return (
    <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-4'}`}>
      <button onClick={onPlayPause} className="p-2 hover:bg-accent rounded-full">
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>

      <button 
        onClick={onLoop} 
        className={`p-2 rounded-full transition-colors ${
          isLooping 
            ? 'bg-primary/20 text-primary hover:bg-primary/30' 
            : 'hover:bg-accent'
        }`}
      >
        <Repeat className="w-6 h-6" />
      </button>

      <button onClick={onMute} className="p-2 hover:bg-accent rounded-full">
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      <button 
        onClick={onLyrics} 
        className="p-2 hover:bg-accent rounded-full"
        disabled={!songId}
      >
        <BookOpen className="w-6 h-6" />
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-sm text-muted-foreground hover:text-foreground rounded-full"
      >
        Close
      </Button>
    </div>
  );
};

export default AudioControls;
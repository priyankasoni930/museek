import { createContext, useContext, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";

type AudioTrack = {
  url: string;
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
} | null;

type AudioPlayerContextType = {
  currentTrack: AudioTrack;
  setCurrentTrack: (track: AudioTrack) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(null);

  return (
    <AudioPlayerContext.Provider value={{ currentTrack, setCurrentTrack }}>
      {children}
      {currentTrack && (
        <AudioPlayer
          url={currentTrack.url}
          songId={currentTrack.id}
          title={currentTrack.title}
          artist={currentTrack.artist}
          imageUrl={currentTrack.imageUrl}
          onClose={() => setCurrentTrack(null)}
        />
      )}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}
import { cn } from "@/lib/utils";

interface SongInfoProps {
  title?: string;
  artist?: string;
  imageUrl?: string;
  songId?: string;
  className?: string;
}

const SongInfo = ({ title, artist, imageUrl, className }: SongInfoProps) => {
  return (
    <div className={cn("flex items-center gap-3 w-full md:w-auto", className)}>
      <img
        src={imageUrl || "/placeholder.svg"}
        alt={title || "Song cover"}
        className="w-14 h-14 rounded-xl object-cover"
      />
      <div className="min-w-0 text-left">
        <h3 className="font-medium truncate">{title || "Unknown Title"}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {artist || "Unknown Artist"}
        </p>
      </div>
    </div>
  );
};

export default SongInfo;
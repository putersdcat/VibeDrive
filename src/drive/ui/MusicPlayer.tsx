import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { TRACKS } from "../scenes";
import { useDrive } from "../store";

export function MusicPlayer() {
  const open = useDrive((s) => s.musicOpen);
  const musicOn = useDrive((s) => s.musicOn);
  const trackIndex = useDrive((s) => s.trackIndex);
  const setMusicOn = useDrive((s) => s.setMusicOn);
  const nextTrack = useDrive((s) => s.nextTrack);
  if (!open) return null;
  const track = TRACKS[trackIndex] ?? TRACKS[0]!;

  return (
    <div className="vd-player">
      <div className="vd-player-meta">
        <span className="vd-player-kicker">Cabin radio</span>
        <span className="vd-player-title">{track.title}</span>
      </div>
      <div className="vd-player-controls">
        <button type="button" aria-label="Previous" onClick={() => nextTrack(-1)}>
          <SkipBack strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className="is-main"
          aria-label={musicOn ? "Pause" : "Play"}
          onClick={() => setMusicOn(!musicOn)}
        >
          {musicOn ? <Pause strokeWidth={1.7} /> : <Play strokeWidth={1.7} />}
        </button>
        <button type="button" aria-label="Next" onClick={() => nextTrack(1)}>
          <SkipForward strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}

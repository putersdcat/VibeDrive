import type { ReactNode } from "react";
import { LayoutPanelLeft, Settings2, Volume2, VolumeX } from "lucide-react";
import { useDrive } from "../store";

export function HeaderBar({ account }: { account?: ReactNode }) {
  const dockOpen = useDrive((s) => s.dockOpen);
  const muted = useDrive((s) => s.muted);
  const setDockOpen = useDrive((s) => s.setDockOpen);
  const setSettingsOpen = useDrive((s) => s.setSettingsOpen);
  const setMuted = useDrive((s) => s.setMuted);
  const setMusicOpen = useDrive((s) => s.setMusicOpen);
  const musicOpen = useDrive((s) => s.musicOpen);

  return (
    <header className="vd-header">
      <div className="vd-brand">
        <span className="vd-logo" aria-hidden />
        <span className="vd-wordmark">VibeDrive</span>
      </div>
      <div className="vd-meta">
        {account}
        <button
          type="button"
          className="vd-icon-btn"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted(!muted)}
        >
          {muted ? <VolumeX strokeWidth={1.7} /> : <Volume2 strokeWidth={1.7} />}
        </button>
        <button
          type="button"
          className={musicOpen ? "vd-icon-btn is-on" : "vd-icon-btn"}
          aria-label="Music"
          aria-pressed={musicOpen}
          onClick={() => setMusicOpen(!musicOpen)}
        >
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden>
            <path
              d="M7.2 15.2V4.6l7.4-1.7v10.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="5.4" cy="15.3" r="2.1" fill="currentColor" />
            <circle cx="12.6" cy="13.5" r="2.1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="vd-icon-btn"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className={dockOpen ? "vd-icon-btn is-on" : "vd-icon-btn"}
          aria-label={dockOpen ? "Hide scenes" : "Show scenes"}
          aria-pressed={dockOpen}
          onClick={() => setDockOpen(!dockOpen)}
        >
          <LayoutPanelLeft strokeWidth={1.7} />
        </button>
      </div>
    </header>
  );
}

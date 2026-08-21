import type { ReactNode } from "react";
import { LayoutPanelLeft, Settings2, Volume2, VolumeX } from "lucide-react";
import { useDrive } from "../store";
import { BrandMark } from "./BrandMark";

export function HeaderBar({ account }: { account?: ReactNode }) {
  const dockOpen = useDrive((s) => s.dockOpen);
  const muted = useDrive((s) => s.muted);
  const setDockOpen = useDrive((s) => s.setDockOpen);
  const setSettingsOpen = useDrive((s) => s.setSettingsOpen);
  const setMuted = useDrive((s) => s.setMuted);

  return (
    <header className="vd-header">
      <div className="vd-brand">
        <BrandMark />
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

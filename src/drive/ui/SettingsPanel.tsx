import { X } from "lucide-react";
import { useDrive } from "../store";

function SliderRow({
  label,
  value,
  onChange,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="vd-slider">
      <span className="vd-slider-head">
        <span>{label}</span>
        <span>{format(value)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  );
}

export function SettingsPanel() {
  const open = useDrive((s) => s.settingsOpen);
  const setSettingsOpen = useDrive((s) => s.setSettingsOpen);
  const unit = useDrive((s) => s.unit);
  const setUnit = useDrive((s) => s.setUnit);
  const theme = useDrive((s) => s.theme);
  const setTheme = useDrive((s) => s.setTheme);
  const engineVolume = useDrive((s) => s.engineVolume);
  const setEngineVolume = useDrive((s) => s.setEngineVolume);
  const musicVolume = useDrive((s) => s.musicVolume);
  const setMusicVolume = useDrive((s) => s.setMusicVolume);
  const hudHidden = useDrive((s) => s.hudHidden);
  const setHudHidden = useDrive((s) => s.setHudHidden);
  const wheelRight = useDrive((s) => s.wheelRight);
  const setWheelRight = useDrive((s) => s.setWheelRight);
  const simulate = useDrive((s) => s.simulate);
  const setSimulate = useDrive((s) => s.setSimulate);
  const pinSpeed = useDrive((s) => s.pinSpeed);
  const setPinSpeed = useDrive((s) => s.setPinSpeed);
  const pinnedKmh = useDrive((s) => s.pinnedKmh);
  const setPinnedKmh = useDrive((s) => s.setPinnedKmh);
  const demoOn = useDrive((s) => s.demoOn);
  const setDemoOn = useDrive((s) => s.setDemoOn);
  const carBrowser = useDrive((s) => s.carBrowser);
  const hypeOn = useDrive((s) => s.hypeOn);
  const setHypeOn = useDrive((s) => s.setHypeOn);

  if (!open) return null;

  return (
    <div className="vd-modal" role="dialog" aria-modal aria-labelledby="vd-settings-title">
      <button type="button" className="vd-scrim" aria-label="Close settings" onClick={() => setSettingsOpen(false)} />
      <div className="vd-panel">
        <div className="vd-panel-head">
          <h2 id="vd-settings-title">Settings</h2>
          <button type="button" className="vd-icon-btn" aria-label="Close" onClick={() => setSettingsOpen(false)}>
            <X strokeWidth={1.7} />
          </button>
        </div>

        <section className="vd-group">
          <h3>Sound</h3>
          <SliderRow label="Engine" value={engineVolume} onChange={setEngineVolume} format={(v) => `${Math.round(v * 100)}%`} />
          <SliderRow label="Music" value={musicVolume} onChange={setMusicVolume} format={(v) => `${Math.round(v * 100)}%`} />
        </section>

        <section className="vd-group">
          <h3>Drive</h3>
          <div className="vd-row">
            <span>Speed unit</span>
            <div className="vd-pills">
              <button type="button" className={unit === "kmh" ? "is-on" : undefined} onClick={() => setUnit("kmh")}>
                km/h
              </button>
              <button type="button" className={unit === "mph" ? "is-on" : undefined} onClick={() => setUnit("mph")}>
                mph
              </button>
            </div>
          </div>
          <div className="vd-row">
            <span>Use pedals instead of GPS</span>
            <button
              type="button"
              role="switch"
              aria-checked={simulate}
              className={simulate ? "vd-switch is-on" : "vd-switch"}
              onClick={() => setSimulate(!simulate)}
            >
              <span />
            </button>
          </div>
          <div className="vd-row">
            <span>Pin speed</span>
            <button
              type="button"
              role="switch"
              aria-checked={pinSpeed}
              className={pinSpeed ? "vd-switch is-on" : "vd-switch"}
              onClick={() => setPinSpeed(!pinSpeed)}
            >
              <span />
            </button>
          </div>
          {pinSpeed ? (
            <SliderRow
              label="Pinned speed"
              value={pinnedKmh / 220}
              onChange={(v) => setPinnedKmh(Math.round(v * 220))}
              format={() => `${pinnedKmh} km/h`}
            />
          ) : null}
          {carBrowser ? null : (
            <div className="vd-row">
              <span>Cabin demo</span>
              <button
                type="button"
                role="switch"
                aria-checked={demoOn}
                className={demoOn ? "vd-switch is-on" : "vd-switch"}
                onClick={() => setDemoOn(!demoOn)}
              >
                <span />
              </button>
            </div>
          )}
          <p className="vd-hint">
            In a Tesla, speed is the in-car browser GPS. On a desk, use pedals, pin, or the local demo wave — nothing
            leaves this tab.
          </p>
        </section>

        <section className="vd-group">
          <h3>Cabin hype</h3>
          <p className="vd-hint">
            Citrus Gator plays short public clips of Jeremy Judkins (with permission) on gator hits, plus original
            produce-rain lines.
          </p>
          <div className="vd-row">
            <span>Callouts</span>
            <button
              type="button"
              role="switch"
              aria-checked={hypeOn}
              className={hypeOn ? "vd-switch is-on" : "vd-switch"}
              onClick={() => setHypeOn(!hypeOn)}
            >
              <span />
            </button>
          </div>
        </section>

        <section className="vd-group">
          <h3>Display</h3>
          <div className="vd-row">
            <span>Theme</span>
            <div className="vd-pills">
              {(["dark", "light", "auto"] as const).map((t) => (
                <button key={t} type="button" className={theme === t ? "is-on" : undefined} onClick={() => setTheme(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="vd-row">
            <span>Hide HUD</span>
            <button
              type="button"
              role="switch"
              aria-checked={hudHidden}
              className={hudHidden ? "vd-switch is-on" : "vd-switch"}
              onClick={() => setHudHidden(!hudHidden)}
            >
              <span />
            </button>
          </div>
          <div className="vd-row">
            <span>Dock on right</span>
            <button
              type="button"
              role="switch"
              aria-checked={wheelRight}
              className={wheelRight ? "vd-switch is-on" : "vd-switch"}
              onClick={() => setWheelRight(!wheelRight)}
            >
              <span />
            </button>
          </div>
        </section>

        <p className="vd-legal">
          GPS stays in this browser. Nothing is uploaded.{" "}
          <a href={`${import.meta.env.BASE_URL}privacy`}>Privacy</a>
        </p>
      </div>
    </div>
  );
}

import { X } from "lucide-react";
import { teslaStream } from "../telemetry";
import { useDrive } from "../store";
import type { TeslaLink } from "../types";

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

const TESLA_LINKS: { id: TeslaLink; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "tessie", label: "Tessie" },
  { id: "custom", label: "Custom" },
  { id: "demo", label: "Demo" },
];

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
  const teslaLink = useDrive((s) => s.teslaLink);
  const setTeslaLink = useDrive((s) => s.setTeslaLink);
  const teslaVin = useDrive((s) => s.teslaVin);
  const setTeslaVin = useDrive((s) => s.setTeslaVin);
  const teslaToken = useDrive((s) => s.teslaToken);
  const setTeslaToken = useDrive((s) => s.setTeslaToken);
  const teslaWsUrl = useDrive((s) => s.teslaWsUrl);
  const setTeslaWsUrl = useDrive((s) => s.setTeslaWsUrl);
  const teslaUnit = useDrive((s) => s.teslaUnit);
  const setTeslaUnit = useDrive((s) => s.setTeslaUnit);
  const teslaStatus = useDrive((s) => s.teslaStatus);
  const teslaError = useDrive((s) => s.teslaError);
  const setTesla = useDrive((s) => s.setTesla);
  const hypeOn = useDrive((s) => s.hypeOn);
  const setHypeOn = useDrive((s) => s.setHypeOn);

  if (!open) return null;

  const pickLink = (id: TeslaLink) => {
    setTeslaLink(id);
    if (id === "off") {
      teslaStream.stop();
      setTesla("idle", null);
    }
  };

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
            <span>Prefer simulation</span>
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
        </section>

        <section className="vd-group">
          <h3>Tesla telemetry</h3>
          <p className="vd-hint">
            Official Fleet Telemetry lands on a server you own — a static demo cannot terminate it. Use Tessie, a
            custom <code>wss://</code> forwarder, GPS with the phone in the car, or the cabin demo.
          </p>
          <div className="vd-row">
            <span>Source</span>
            <div className="vd-pills">
              {TESLA_LINKS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={teslaLink === opt.id ? "is-on" : undefined}
                  onClick={() => pickLink(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {teslaLink === "tessie" ? (
            <>
              <label className="vd-field">
                <span>VIN</span>
                <input
                  value={teslaVin}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="5YJ…"
                  onChange={(e) => setTeslaVin(e.target.value.toUpperCase())}
                />
              </label>
              <label className="vd-field">
                <span>Tessie access token</span>
                <input
                  type="password"
                  value={teslaToken}
                  autoComplete="off"
                  placeholder="stays in this browser"
                  onChange={(e) => setTeslaToken(e.target.value)}
                />
              </label>
            </>
          ) : null}
          {teslaLink === "custom" ? (
            <>
              <label className="vd-field">
                <span>WebSocket URL</span>
                <input
                  value={teslaWsUrl}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="wss://your-forwarder/speed"
                  onChange={(e) => setTeslaWsUrl(e.target.value)}
                />
              </label>
              <div className="vd-row">
                <span>Stream unit</span>
                <div className="vd-pills">
                  <button type="button" className={teslaUnit === "mph" ? "is-on" : undefined} onClick={() => setTeslaUnit("mph")}>
                    mph
                  </button>
                  <button type="button" className={teslaUnit === "kmh" ? "is-on" : undefined} onClick={() => setTeslaUnit("kmh")}>
                    km/h
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {teslaLink === "demo" ? (
            <p className="vd-hint">A Tesla-shaped speed wave generated in this tab. No account, no car.</p>
          ) : null}
          {teslaLink !== "off" ? (
            <div className="vd-row">
              <span className="vd-tesla-status">
                {teslaStatus}
                {teslaError ? ` · ${teslaError}` : teslaStatus === "live" ? " · VehicleSpeed" : ""}
              </span>
              <div className="vd-pills">
                {teslaStatus === "live" || teslaStatus === "connecting" ? (
                  <button
                    type="button"
                    className="vd-action is-ghost"
                    onClick={() => {
                      teslaStream.stop();
                      setTesla("idle", null);
                    }}
                  >
                    Stop
                  </button>
                ) : null}
                <button type="button" className="vd-action" onClick={() => teslaStream.connect()}>
                  {teslaLink === "demo" ? "Start demo" : teslaStatus === "live" ? "Reconnect" : "Connect"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="vd-group">
          <h3>Cabin hype</h3>
          <p className="vd-hint">
            Original shout-outs on Citrus Gator and Xing Ghost. Not anyone's real voice — a cabin commentator.
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
          GPS, VIN, and tokens stay in this browser. Nothing is uploaded.{" "}
          <a href={`${import.meta.env.BASE_URL}privacy`}>Privacy</a>
        </p>
      </div>
    </div>
  );
}

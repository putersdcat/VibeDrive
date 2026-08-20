import { sceneById } from "../scenes";
import { displaySpeed, useDrive } from "../store";

export function Hud() {
  const speedMps = useDrive((s) => s.speedMps);
  const unit = useDrive((s) => s.unit);
  const load = useDrive((s) => s.load);
  const rpm = useDrive((s) => s.rpm);
  const accel = useDrive((s) => s.accelMs2);
  const hudHidden = useDrive((s) => s.hudHidden);
  const sceneId = useDrive((s) => s.sceneId);
  const isManual = useDrive((s) => s.isManual);
  const gear = useDrive((s) => s.gear);
  const setManual = useDrive((s) => s.setManual);
  const source = useDrive((s) => s.source);
  const teslaStatus = useDrive((s) => s.teslaStatus);
  const teslaError = useDrive((s) => s.teslaError);
  const fps = useDrive((s) => s.fps);
  const throttle = useDrive((s) => s.throttle);

  if (hudHidden) return null;
  const scene = sceneById(sceneId);
  const speed = displaySpeed(speedMps, unit);
  const fill = Math.min(1, rpm / scene.redline);
  const redlineStart = 0.82;

  const notice =
    teslaStatus === "connecting"
      ? "Tesla connecting"
      : teslaStatus === "error"
        ? teslaError || "Tesla stream error"
        : source === "tesla"
          ? "Tesla telemetry live"
          : source === "gps"
            ? "GPS live"
            : source === "pin"
              ? "Pinned speed"
              : throttle
                ? "Simulated throttle"
                : "Throttle · GPS · Tesla";

  return (
    <>
      <div className="vd-readout">
        <p className="vd-speed">
          <span className="vd-speed-value">{speed}</span>
          <span className="vd-speed-unit">{unit === "mph" ? "mph" : "km/h"}</span>
        </p>
      </div>

      <div
        className="vd-gauge"
        style={
          {
            "--gauge-fill": `${fill * 100}%`,
            "--gauge-redline": `${(1 - redlineStart) * 100}%`,
          } as React.CSSProperties
        }
      >
        <div className="vd-gauge-bar">
          <span className="vd-gauge-redline" />
          <span className="vd-gauge-fill" />
        </div>
        <dl className="vd-stats">
          <div>
            <dt>Load</dt>
            <dd>{Math.round(load * 100)} %</dd>
          </div>
          <div>
            <dt>Revs</dt>
            <dd>{Math.round(rpm).toLocaleString()} rpm</dd>
          </div>
          <div>
            <dt>Acceleration</dt>
            <dd>
              {accel >= 0 ? "+" : ""}
              {accel.toFixed(1)} m/s²
            </dd>
          </div>
        </dl>
      </div>

      <div className="vd-mode">
        <button
          type="button"
          className={isManual ? "vd-mode-switch is-manual" : "vd-mode-switch"}
          aria-pressed={isManual}
          aria-label="Gearbox"
          disabled={!scene.hasManual}
          onClick={() => setManual(!isManual)}
        >
          <span>Auto</span>
          <span className={!scene.hasManual ? "is-locked" : undefined}>
            {!scene.hasManual ? (
              <svg viewBox="0 0 12 14" width="10" height="12" aria-hidden>
                <path
                  d="M3.4 6V4.2a2.6 2.6 0 0 1 5.2 0V6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <rect x="1.9" y="6" width="8.2" height="6.6" rx="1.8" fill="currentColor" />
              </svg>
            ) : null}
            Manual
          </span>
          <i className="vd-mode-pill" />
        </button>
        <span className="vd-mode-cap">
          Gearbox{isManual ? ` · ${gear}` : ""}
        </span>
      </div>

      <p className="vd-notice">
        {notice}
        {fps > 0 ? ` · ${Math.round(fps)} fps` : ""}
      </p>
    </>
  );
}

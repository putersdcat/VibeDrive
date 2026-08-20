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
  const gpsStatus = useDrive((s) => s.gpsStatus);
  const carBrowser = useDrive((s) => s.carBrowser);
  const fps = useDrive((s) => s.fps);

  if (hudHidden) return null;
  const scene = sceneById(sceneId);
  const speed = displaySpeed(speedMps, unit);
  const fill = Math.min(1, rpm / scene.redline);
  const redlineStart = 0.82;

  const notice =
    source === "demo"
      ? "Cabin demo"
      : source === "pin"
        ? "Pinned speed"
        : source === "gps"
          ? carBrowser
            ? gpsStatus === "live"
              ? "Car GPS live"
              : gpsStatus === "waiting"
                ? "Waiting on this car's GPS"
                : gpsStatus === "denied"
                  ? "Location denied — allow GPS in the Tesla browser"
                  : "Car GPS"
            : "Car GPS"
          : "Pedals";

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
            <dt>{scene.hasManual ? "Revs" : "Motor"}</dt>
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

      {scene.hasManual ? (
      <div className="vd-mode">
        <button
          type="button"
          className={isManual ? "vd-mode-switch is-manual" : "vd-mode-switch"}
          aria-pressed={isManual}
          aria-label="Gearbox"
          onClick={() => setManual(!isManual)}
        >
          <span>Auto</span>
          <span>Manual</span>
          <i className="vd-mode-pill" />
        </button>
        <span className="vd-mode-cap">
          Gearbox{isManual ? ` · ${gear}` : ""}
        </span>
      </div>
      ) : (
        <p className="vd-mode vd-mode-cap">Direct drive</p>
      )}

      <p className="vd-notice">
        {notice}
        {fps > 0 ? ` · ${Math.round(fps)} fps` : ""}
      </p>
    </>
  );
}

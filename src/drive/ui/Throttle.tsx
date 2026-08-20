import { useDrive } from "../store";

export function Throttle() {
  const setThrottle = useDrive((s) => s.setThrottle);
  const setBrake = useDrive((s) => s.setBrake);
  const throttle = useDrive((s) => s.throttle);
  const brake = useDrive((s) => s.brake);
  const pinSpeed = useDrive((s) => s.pinSpeed);
  if (pinSpeed) return null;

  const bind = (which: "throttle" | "brake") => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (which === "throttle") setThrottle(true);
      else setBrake(true);
    },
    onPointerUp: () => {
      if (which === "throttle") setThrottle(false);
      else setBrake(false);
    },
    onPointerCancel: () => {
      if (which === "throttle") setThrottle(false);
      else setBrake(false);
    },
  });

  return (
    <div className="vd-pedals">
      <button type="button" className={brake ? "is-down" : undefined} aria-label="Brake" {...bind("brake")}>
        Brake
      </button>
      <button
        type="button"
        className={throttle ? "is-down is-go" : "is-go"}
        aria-label="Throttle"
        {...bind("throttle")}
      >
        Throttle
      </button>
    </div>
  );
}

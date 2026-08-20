export function PrivacyPage() {
  const home = import.meta.env.BASE_URL || "/";
  return (
    <main className="vd-doc">
      <div className="vd-doc-inner">
        <a href={home}>← VibeDrive</a>
        <h1>Privacy</h1>
        <p>
          VibeDrive reads GPS in this browser so the scenery and engine follow real speed. In a Tesla that is the
          in-car browser's Geolocation API (coords.speed) — not Tesla Fleet, not Tessie. Coordinates never leave
          the device. There is no analytics pixel and no third-party map tile call.
        </p>
        <p>
          Optional Tessie / custom WebSocket pairing (token, VIN, URL) is stored only in this browser's
          localStorage and is never uploaded.
        </p>
        <p>
          Sign-in (Google or X) is optional and only identifies you so cabin settings can follow the account. Engine
          audio and lo-fi are synthesized locally with the Web Audio API. Cabin hype lines are original synthesized
          shout-outs shipped as static MP3s — not a recording of any real person. The road is a WebGL2 shader plus a
          small Rust WASM particle core that runs entirely on-device.
        </p>
        <p>This is an original recreation of the GPS-cabin-HUD idea, not affiliated with dribe.app.</p>
      </div>
    </main>
  );
}

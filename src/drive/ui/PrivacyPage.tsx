export function PrivacyPage() {
  const home = import.meta.env.BASE_URL || "/";
  return (
    <main className="vd-doc">
      <div className="vd-doc-inner">
        <a href={home}>← VibeDrive</a>
        <h1>Privacy</h1>
        <p>
          VibeDrive reads GPS in this browser so the scenery and engine follow real speed. In a Tesla that is the
          in-car browser's Geolocation API (coords.speed). Coordinates never leave the device. There is no
          analytics pixel, no third-party map call, and no vehicle token or WebSocket.
        </p>
        <p>
          Sign-in (Google or X) is optional and only identifies you so cabin settings can follow the account. Engine
          audio and lo-fi are synthesized locally with the Web Audio API. Cabin hype lines are original synthesized
          shout-outs shipped as static MP3s. Citrus Gator also plays short reaction clips from Jeremy Judkins'
          public X posts (manatees, Florida), used with his permission. The road is a WebGL2 shader plus a small Rust
          WASM particle core that runs entirely on-device.
        </p>
        <p>This is an original recreation of the GPS-cabin-HUD idea, not affiliated with dribe.app.</p>
      </div>
    </main>
  );
}

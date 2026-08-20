export function PrivacyPage() {
  const home = import.meta.env.BASE_URL || "/";
  return (
    <main className="vd-doc">
      <div className="vd-doc-inner">
        <a href={home}>← VibeDrive</a>
        <h1>Privacy</h1>
        <p>
          VibeDrive reads your device GPS in the browser so the scenery and engine can follow real speed. Coordinates
          never leave the device. There is no analytics pixel and no third-party map tile call.
        </p>
        <p>
          Tesla pairing (Tessie access token, VIN, custom WebSocket URL) is stored only in this browser's
          localStorage. VibeDrive never uploads those values. Official Tesla Fleet Telemetry is a vehicle-to-your-server
          stream; this static cabin cannot terminate it, which is why Tessie, a URL you host, GPS, or the local demo
          exist.
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

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
          Sign-in (Google or X) is optional and only identifies you so cabin settings can follow the account. Engine
          audio and lo-fi are synthesized locally with the Web Audio API — no audio files are downloaded from a CDN.
        </p>
        <p>This is an original recreation of the GPS-cabin-HUD idea, not affiliated with dribe.app.</p>
      </div>
    </main>
  );
}

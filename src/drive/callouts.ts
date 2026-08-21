import { useDrive } from "./store";

export type HypeLine =
  | "jesus"
  | "oh-my"
  | "gator"
  | "bananas"
  | "hotdogs"
  | "cukes"
  | "oh-no"
  | "phantom"
  | "holy";

const LINES: HypeLine[] = [
  "jesus",
  "oh-my",
  "gator",
  "bananas",
  "hotdogs",
  "cukes",
  "oh-no",
  "phantom",
  "holy",
];

export const HYPE_LINE_COUNT = LINES.length;

const FALLBACK: Record<HypeLine, string> = {
  jesus: "Jesus!",
  "oh-my": "Oh my!",
  gator: "Look at that gator!",
  bananas: "It's raining bananas!",
  hotdogs: "Hot dogs?!",
  cukes: "Cucumbers? Jesus!",
  "oh-no": "Oh no no no!",
  phantom: "Phantom brake. Oh come on.",
  holy: "Holy moly!",
};

class CabinHype {
  private base = "/";
  private last = 0;
  private busy = false;
  private clips = new Map<HypeLine, HTMLAudioElement>();
  private priming: Promise<void> | null = null;

  attach(base: string) {
    this.base = base.replace(/\/?$/, "/");
  }

  prime() {
    void this.primeAsync();
  }

  primeAsync(onProgress?: () => void): Promise<void> {
    if (this.priming) return this.priming;

    const promise = (async () => {
      await Promise.all(
        LINES.map(async (id) => {
          let clip = this.clips.get(id);
          try {
            if (!clip) {
              clip = new Audio(`${this.base}callouts/${id}.mp3`);
              clip.preload = "auto";
              clip.volume = 0.92;
              this.clips.set(id, clip);
            }
            const audio = clip;
            await new Promise<void>((resolve) => {
              let finished = false;
              const finish = () => {
                if (finished) return;
                finished = true;
                window.clearTimeout(timer);
                audio.removeEventListener("loadeddata", finish);
                audio.removeEventListener("canplaythrough", finish);
                audio.removeEventListener("error", finish);
                resolve();
              };
              const timer = window.setTimeout(finish, 12000);
              audio.addEventListener("loadeddata", finish, { once: true });
              audio.addEventListener("canplaythrough", finish, { once: true });
              audio.addEventListener("error", finish, { once: true });
              if (audio.readyState >= 2) finish();
              else audio.load();
            });
          } catch {
            // Speech synthesis remains available when an audio clip cannot load.
          } finally {
            onProgress?.();
          }
        }),
      );

      const first = this.clips.get("oh-my");
      if (!first) return;
      first.volume = 0;
      try {
        void first.play().then(
          () => {
            first.pause();
            first.currentTime = 0;
            first.volume = 0.92;
          },
          () => {
            first.volume = 0.92;
          },
        );
      } catch {
        first.volume = 0.92;
      }
    })();

    this.priming = promise;
    void promise.then(
      () => {
        if (this.priming === promise) this.priming = null;
      },
      () => {
        if (this.priming === promise) this.priming = null;
      },
    );
    return promise;
  }

  shout(id: HypeLine) {
    const s = useDrive.getState();
    if (s.muted || !s.hypeOn) return;
    const now = performance.now();
    if (this.busy && now - this.last < 2800) return;
    this.last = now;
    this.busy = true;
    const clip = this.clips.get(id);
    if (clip) {
      clip.currentTime = 0;
      clip.onended = () => {
        this.busy = false;
      };
      void clip.play().then(
        () => undefined,
        () => this.speak(id),
      );
      return;
    }
    this.speak(id);
  }

  private speak(id: HypeLine) {
    const text = FALLBACK[id];
    if (!("speechSynthesis" in window)) {
      this.busy = false;
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.08;
    u.pitch = 0.92;
    u.lang = "en-US";
    u.onend = () => {
      this.busy = false;
    };
    u.onerror = () => {
      this.busy = false;
    };
    window.speechSynthesis.speak(u);
  }
}

export const cabinHype = new CabinHype();

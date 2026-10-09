"use client";

/**
 * Repère les différentes tenues d'une vidéo (TikTok, Reels… enregistrée ou filmée),
 * entièrement dans le navigateur : rien n'est envoyé tant que l'utilisateur n'a pas choisi.
 *
 * Principe : on lit la vidéo en accéléré et, pour chaque image, on mesure la répartition des
 * couleurs au CENTRE (là où se tient la personne). Un mouvement de caméra ou de la personne
 * la change peu ; une autre tenue la change beaucoup. On garde une image dès qu'elle diffère
 * nettement de TOUTES les tenues déjà gardées (revenir sur une tenue déjà vue ne compte pas).
 */

export interface Frame {
  dataUrl: string;
  portrait: boolean;
  /** Moment de la vidéo, en secondes. */
  time: number;
}

const SIG = 32; // côté de la vignette de comparaison
const LEVELS = 4; // niveaux par couleur : 4 × 4 × 4 = 64 teintes
const NEW_OUTFIT = 0.2; // part des couleurs qui a changé (0-1) à partir de laquelle c'est une autre tenue
const MAX_SECONDS = 180;

function once(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      el.removeEventListener(event, ok);
      el.removeEventListener("error", ko);
      resolve();
    };
    const ko = () => {
      el.removeEventListener(event, ok);
      el.removeEventListener("error", ko);
      reject(new Error("Cette vidéo ne peut pas être lue par ton navigateur."));
    };
    el.addEventListener(event, ok);
    el.addEventListener("error", ko);
  });
}

async function seek(video: HTMLVideoElement, t: number) {
  const done = once(video, "seeked");
  video.currentTime = t;
  await done;
}

/** Répartition des couleurs (64 teintes) dans le centre de l'image : 60 % de la largeur, 80 % de la hauteur. */
function signature(video: HTMLVideoElement, ctx: CanvasRenderingContext2D): Float32Array {
  const w = video.videoWidth;
  const h = video.videoHeight;
  ctx.drawImage(video, w * 0.2, h * 0.1, w * 0.6, h * 0.8, 0, 0, SIG, SIG);
  const { data } = ctx.getImageData(0, 0, SIG, SIG);
  const hist = new Float32Array(LEVELS ** 3);
  const q = (v: number) => Math.min(LEVELS - 1, Math.floor((v / 256) * LEVELS));
  for (let i = 0; i < data.length; i += 4) {
    hist[q(data[i]) * LEVELS * LEVELS + q(data[i + 1]) * LEVELS + q(data[i + 2])] += 1;
  }
  const n = SIG * SIG;
  for (let i = 0; i < hist.length; i++) hist[i] /= n;
  return hist;
}

/** Part des couleurs qui diffère entre deux images (0 = identiques, 1 = rien en commun). */
function distance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / 2;
}

function capture(video: HTMLVideoElement, maxSide: number): Omit<Frame, "time"> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext("2d")!.drawImage(video, 0, 0, c.width, c.height);
  return { dataUrl: c.toDataURL("image/jpeg", 0.85), portrait: h > w * 1.15 };
}

export async function extractOutfitFrames(
  file: File,
  { max = 8, maxSide = 896, onProgress }: { max?: number; maxSide?: number; onProgress?: (p: number) => void } = {},
): Promise<Frame[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await once(video, "loadeddata");
    if (!video.videoWidth) throw new Error("Cette vidéo ne peut pas être lue par ton navigateur.");
    // Certains enregistrements n'annoncent pas leur durée : on la fait calculer, pour la barre de progression.
    if (!Number.isFinite(video.duration)) {
      const known = once(video, "durationchange");
      video.currentTime = 1e101;
      await Promise.race([known, new Promise((r) => setTimeout(r, 4000))]);
      await seek(video, 0);
    }
    const duration = Number.isFinite(video.duration) ? Math.min(video.duration, MAX_SECONDS) : MAX_SECONDS;

    const small = document.createElement("canvas");
    small.width = small.height = SIG;
    const ctx = small.getContext("2d", { willReadFrequently: true })!;
    const kept: Array<{ sig: Float32Array; frame: Frame; gap: number }> = [];
    let pendingSince: number | null = null;
    let lastSample = -Infinity;
    // Une image toutes les 0,4 s environ de vidéo.
    const step = Math.max(0.4, duration / 200);

    const sample = () => {
      const t = video.currentTime;
      if (t - lastSample < step || video.readyState < 2) return;
      lastSample = t;
      onProgress?.(Math.min(1, t / duration));
      const sig = signature(video, ctx);
      const gap = kept.length ? Math.min(...kept.map((k) => distance(sig, k.sig))) : 1;
      if (gap < NEW_OUTFIT) {
        pendingSince = null;
        return;
      }
      // Nouvelle tenue : on attend qu'elle tienne un instant, pour ne pas garder une image de transition.
      if (pendingSince === null && kept.length) {
        pendingSince = t;
        return;
      }
      kept.push({ sig, gap, frame: { ...capture(video, maxSide), time: t } });
      pendingSince = null;
    };

    // On LIT la vidéo en accéléré (muette, invisible) plutôt que de sauter d'un moment à l'autre :
    // beaucoup de vidéos enregistrées ne permettent pas de se placer précisément.
    await new Promise<void>((resolve, reject) => {
      let stopped = false;
      const stop = () => {
        if (stopped) return;
        stopped = true;
        video.pause();
        resolve();
      };
      video.addEventListener("ended", stop, { once: true });
      video.addEventListener("error", () => reject(new Error("Cette vidéo ne peut pas être lue par ton navigateur.")), { once: true });
      const hasFrameCallback = "requestVideoFrameCallback" in video;
      const tick = () => {
        if (stopped) return;
        sample();
        if (video.currentTime >= duration) return stop();
        if (hasFrameCallback) video.requestVideoFrameCallback(tick);
      };
      const timer = hasFrameCallback ? null : setInterval(tick, 60);
      video.addEventListener("ended", () => timer && clearInterval(timer), { once: true });
      video.currentTime = 0;
      video.playbackRate = 4;
      video
        .play()
        .then(() => {
          if (hasFrameCallback) video.requestVideoFrameCallback(tick);
        })
        .catch(() => reject(new Error("Cette vidéo ne peut pas être lue par ton navigateur.")));
    });
    onProgress?.(1);

    // Trop de tenues : on garde les plus différentes, dans l'ordre de la vidéo.
    const best = [...kept].sort((a, b) => b.gap - a.gap).slice(0, max);
    return kept.filter((k) => best.includes(k)).map((k) => k.frame);
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

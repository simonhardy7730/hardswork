"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Intro : une veste en denim fermée par une fermeture éclair.
 * Le curseur descend tout seul (ou au doigt), la veste s'ouvre en V
 * et révèle le site en dessous, comme une doublure. Jouée une fois par session.
 */

const DENIM = "#1E2B4D";
const THREAD = "#D9822B";
const TAPE = "#121A30";

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;

function makeDenimPattern(ctx: CanvasRenderingContext2D, dpr: number) {
  const size = Math.round(96 * dpr);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = DENIM;
  g.fillRect(0, 0, size, size);
  // Sergé : diagonales fines, claires et sombres
  g.lineWidth = 1 * dpr;
  for (let i = -size; i < size * 2; i += 3 * dpr) {
    g.strokeStyle = (i / (3 * dpr)) % 2 === 0 ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.10)";
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i - size, size);
    g.stroke();
  }
  // Grain : fils de trame irréguliers
  for (let k = 0; k < 900; k++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    g.fillStyle = Math.random() < 0.55 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
    g.fillRect(x, y, 1.4 * dpr, 0.8 * dpr);
  }
  return ctx.createPattern(c, "repeat")!;
}

export function ZipperIntro() {
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (html.dataset.intro === "skip" || reduced) {
      setDone(true);
      return;
    }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    // Le canvas ne lit pas les variables CSS : on récupère le vrai nom de la police chargée.
    const family = getComputedStyle(document.body).fontFamily;
    let firstFrame = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let W = 0,
      H = 0,
      dpr = 1,
      pattern: CanvasPattern;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      pattern = makeDenimPattern(ctx, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // État de l'animation
    let slider = -70; // position verticale du curseur (px CSS)
    let apart = 0; // 0 → 1 : les deux pans s'écartent et sortent
    let phase: "wait" | "unzip" | "part" | "end" = "wait";
    let dragging = false;
    let t0 = performance.now();
    let unzipFrom = slider;
    let raf = 0;
    const DELAY = 650;
    const UNZIP_MS = 1500;
    const PART_MS = 700;

    const finish = () => {
      if (phase === "end") return;
      phase = "end";
      try {
        sessionStorage.setItem("sosilook.intro", "vue");
      } catch {}
      document.body.style.overflow = prevOverflow;
      setDone(true);
    };
    skipRef.current = finish;

    const gapAt = (y: number) => {
      // Ouverture en V au-dessus du curseur, fermé en dessous.
      if (y >= slider) return 0;
      const maxOpen = Math.min(W * 0.5, Math.max(0, slider) * 0.42 + 6);
      return maxOpen * Math.pow(1 - y / Math.max(slider, 1), 1.15);
    };

    const draw = () => {
      const cx = W / 2;
      const shift = easeIn(apart) * (W / 2 + 60);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const STEP = 6;
      for (const side of [-1, 1] as const) {
        const dx = side * shift;
        const edge = (y: number) => cx + side * gapAt(y) + dx;

        // Pan de veste
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(side < 0 ? dx : W + dx, 0);
        for (let y = 0; y <= H; y += STEP) ctx.lineTo(edge(y), y);
        ctx.lineTo(edge(H), H);
        ctx.lineTo(side < 0 ? dx : W + dx, H);
        ctx.closePath();
        ctx.fillStyle = pattern;
        ctx.fill();
        ctx.clip();

        // Ombre portée le long de l'ouverture
        ctx.lineWidth = 18;
        ctx.strokeStyle = "rgba(6,10,22,0.35)";
        ctx.beginPath();
        for (let y = 0; y <= H; y += STEP) ctx.lineTo(edge(y) + side * 4, y);
        ctx.stroke();

        // Ruban de la fermeture
        ctx.lineWidth = 14;
        ctx.strokeStyle = TAPE;
        ctx.beginPath();
        for (let y = 0; y <= H; y += STEP) ctx.lineTo(edge(y) + side * 7, y);
        ctx.stroke();

        // Double surpiqûre orange
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = THREAD;
        for (const off of [24, 31]) {
          ctx.beginPath();
          for (let y = 0; y <= H; y += STEP) ctx.lineTo(edge(y) + side * off, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Étiquette cousue sur le pan gauche
        if (side < 0) drawLabel(ctx, cx * 0.42 + dx, H * 0.24, Math.min(190, W * 0.34), family);
        ctx.restore();

        // Dents en métal (une sur deux de chaque côté)
        const TOOTH = 8;
        for (let i = 0, y = 4; y < H + TOOTH; i++, y += TOOTH) {
          if ((i % 2 === 0) !== (side < 0)) continue;
          const x = edge(y);
          const tx = side < 0 ? x - 3 : x - 5;
          const grd = ctx.createLinearGradient(tx, y, tx + 8, y);
          grd.addColorStop(0, "#8D8676");
          grd.addColorStop(0.5, "#E6E0D2");
          grd.addColorStop(1, "#9A937F");
          ctx.fillStyle = grd;
          roundRect(ctx, tx, y - 2.6, 8, 5.2, 1.6);
          ctx.fill();
        }
      }

      // Curseur + tirette
      if (apart === 0) drawSlider(ctx, cx, slider);

      if (firstFrame && wrapRef.current) {
        firstFrame = false;
        wrapRef.current.style.background = "transparent";
      }
    };

    const loop = (now: number) => {
      if (phase === "end") return;
      if (phase === "wait" && now - t0 > DELAY) {
        phase = "unzip";
        t0 = now;
        unzipFrom = slider;
      }
      if (phase === "unzip" && !dragging) {
        const p = Math.min(1, (now - t0) / UNZIP_MS);
        slider = unzipFrom + (H + 90 - unzipFrom) * easeInOut(p);
        if (p >= 1) {
          phase = "part";
          t0 = now;
        }
      }
      if (phase === "part") {
        apart = Math.min(1, (now - t0) / PART_MS);
        canvas.style.opacity = String(1 - Math.max(0, apart - 0.6) / 0.4);
        if (apart >= 1) {
          finish();
          return;
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Tirer la fermeture au doigt / à la souris
    const onDown = (e: PointerEvent) => {
      if (phase === "part" || phase === "end") return;
      if (Math.abs(e.clientX - W / 2) < 70 && Math.abs(e.clientY - (slider + 40)) < 110) {
        dragging = true;
        phase = "unzip";
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      slider = Math.max(slider, Math.min(H + 90, e.clientY - 40));
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      t0 = performance.now();
      unzipFrom = slider;
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (done) return null;
  return (
    // Fond denim le temps que le canvas dessine sa première image
    <div id="intro-zip" ref={wrapRef} className="fixed inset-0 z-50 bg-denim" role="presentation">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden />
      <button
        type="button"
        onClick={() => skipRef.current()}
        className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-5 font-mono text-xs uppercase tracking-[0.2em] text-[#F4EFE6]/80 hover:text-white"
      >
        Entrer →
      </button>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function metal(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "#7F7968");
  g.addColorStop(0.35, "#EFE9DB");
  g.addColorStop(0.6, "#B7AF9B");
  g.addColorStop(1, "#6E6858");
  return g;
}

function drawSlider(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  // Corps du curseur
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = metal(ctx, cx - 17, cx + 17);
  ctx.beginPath();
  ctx.moveTo(cx - 17, y - 26);
  ctx.lineTo(cx + 17, y - 26);
  ctx.lineTo(cx + 12, y + 14);
  ctx.quadraticCurveTo(cx, y + 20, cx - 12, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Tirette qui pend
  ctx.save();
  ctx.translate(cx, y + 6);
  ctx.rotate(Math.sin(performance.now() / 380) * 0.05);
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = metal(ctx, -12, 12);
  roundRect(ctx, -11, 4, 22, 58, 9);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#1E2B4D";
  roundRect(ctx, -4.5, 12, 9, 22, 4.5);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.font = "600 7px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("S", 0, 52);
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, family: string) {
  const h = w * 0.34;
  ctx.save();
  ctx.translate(x - w / 2, y);
  ctx.rotate(-0.03);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#EFE8DA";
  ctx.fillRect(0, 0, w, h);
  ctx.shadowColor = "transparent";
  // Tissage
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  for (let i = 2; i < w; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  // Couture au fil orange
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = THREAD;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.setLineDash([]);
  ctx.fillStyle = DENIM;
  ctx.textAlign = "center";
  ctx.fontStretch = "expanded";
  ctx.font = `800 ${Math.round(h * 0.3)}px ${family}`;
  ctx.fillText("SOSILOOK", w / 2, h * 0.52);
  ctx.fontStretch = "normal";
  ctx.font = `500 ${Math.max(7, Math.round(h * 0.14))}px ui-monospace, monospace`;
  ctx.fillText("LE SOSIE DE TON LOOK", w / 2, h * 0.78);
  ctx.restore();
}

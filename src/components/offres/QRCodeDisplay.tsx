"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export default function QRCodeDisplay({ url, title }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  function downloadQR() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Créer un canvas plus grand avec le texte
    const exportCanvas = document.createElement("canvas");
    const size = 400;
    const padding = 24;
    const textHeight = 50;
    exportCanvas.width = size;
    exportCanvas.height = size + textHeight;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // QR code
    ctx.drawImage(canvas, padding, padding, size - padding * 2, size - padding * 2);

    // Texte
    ctx.fillStyle = "#0F0E0D";
    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, size / 2, size + 22);
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#6B6760";
    ctx.fillText("Postulez via HardSwork", size / 2, size + 42);

    const link = document.createElement("a");
    link.download = `qr-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={canvasRef}
        className="p-4 bg-white border-2 border-ink-100 rounded-xl inline-block"
      >
        <QRCodeCanvas
          value={url}
          size={200}
          level="M"
          includeMargin={false}
          fgColor="#D93B12"
          bgColor="#FFFFFF"
        />
      </div>
      <p className="text-xs text-ink-300 text-center max-w-xs">
        Imprimez ce QR code et affichez-le dans votre agence ou directement
        sur le lieu de travail.
      </p>
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 px-4 py-2 border border-ink-100 rounded-lg text-sm font-medium text-ink hover:bg-surface-2 transition"
      >
        <Download size={15} />
        Télécharger le QR Code (PNG)
      </button>
    </div>
  );
}

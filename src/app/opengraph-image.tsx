import { ImageResponse } from "next/og";

export const alt = "Wolko — Le bon talent. La bonne entreprise.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#101F43", padding: 72, color: "#fff" }}>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>
          Wolk<span style={{ color: "#FFB900" }}>o</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>Un job près de chez vous.</div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#FFB900" }}>Gratuit pour les candidats · wolko.be</div>
        </div>
      </div>
    ),
    size
  );
}

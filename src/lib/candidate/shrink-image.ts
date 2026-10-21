/** Photo trop lourde (le serveur accepte ~4 Mo) : réduite à 2000 px en JPEG, toujours lisible. */
export async function shrinkImage(f: File): Promise<File> {
  if (!f.type.startsWith("image/") || f.size < 2.5 * 1024 * 1024) return f;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.82));
    return blob ? new File([blob], "cv-photo.jpg", { type: "image/jpeg" }) : f;
  } catch { return f; }
}

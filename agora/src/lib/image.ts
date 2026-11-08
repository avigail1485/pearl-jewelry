/** Downscale a picked photo to a JPEG data URL (keeps db documents small). */
export async function compress(file: Blob, max = 960, quality = 0.72): Promise<string> {
  const bmp = await createImageBitmap(file).catch(() => null);
  let w: number, h: number, src: CanvasImageSource;
  if (bmp) { w = bmp.width; h = bmp.height; src = bmp; }
  else {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    w = img.naturalWidth; h = img.naturalHeight; src = img;
  }
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

export async function dataUrlToBlob(d: string): Promise<Blob> { return (await fetch(d)).blob(); }

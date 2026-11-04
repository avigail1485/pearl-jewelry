/** A small JPEG data URL for a published item's cover, so it survives a reload. Resolves "" if the image can't be read. */
export async function coverDataUrl(file: Blob, max = 720): Promise<string> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions)
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement("canvas")
    c.width = Math.round(bmp.width * s)
    c.height = Math.round(bmp.height * s)
    const ctx = c.getContext("2d")
    if (!ctx) return ""
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close?.()
    return c.toDataURL("image/jpeg", 0.8)
  } catch {
    return ""
  }
}

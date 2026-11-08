// Two builds of the app:
//  · "cutout" (default) — item photos without background; uploads get on-device background removal.
//  · "photos" — real photos (Agora's logo removed, nothing cropped); uploads keep their background,
//    AI recognises the item, its condition and writes a description.
export const VARIANT: "cutout" | "photos" = import.meta.env.VITE_VARIANT === "photos" ? "photos" : "cutout";
export const REMOVE_BG = VARIANT === "cutout";

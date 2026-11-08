import { useEffect, useState } from "react";

export type IllustrationName =
  | "welcome" | "hello" | "searching" | "add-photo" | "message-sent" | "published"
  | "saved-empty" | "verified" | "community" | "loading";

// Natural pixel sizes of the source files, so width/height are explicit (no layout jump).
const NATURAL: Record<IllustrationName, [number, number]> = {
  welcome: [300, 429], hello: [360, 328], searching: [360, 322], "add-photo": [360, 288],
  "message-sent": [360, 420], published: [360, 349], "saved-empty": [360, 370], verified: [360, 442],
  community: [520, 147], loading: [96, 96],
};

interface Props {
  name: IllustrationName;
  /** display width in px; "full" stretches to the container width (keeps ratio) */
  size: number | "full";
  alt?: string;
  eager?: boolean;
  className?: string;
}

export function Illustration({ name, size, alt = "", eager, className = "" }: Props) {
  const reduced = false; // the animations always play (they are gentle, built-in loops)
  const [nw, nh] = NATURAL[name];
  const w = size === "full" ? nw : size;
  const h = Math.round((w * nh) / nw);
  const base = "./assets";
  const style = size === "full" ? { width: "100%", height: "auto" } : { width: w, height: h };
  const common = {
    alt,
    width: w,
    height: h,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    decoding: "async" as const,
    style,
    className: `block select-none ${className}`,
    draggable: false,
    "aria-hidden": alt ? undefined : true,
  };
  const [animReady, setAnimReady] = useState(!eager);
  useEffect(() => {
    if (!eager || reduced) return;
    // Above the fold: paint the light first frame now, swap to the animation once it has loaded.
    const img = new Image();
    img.onload = () => setAnimReady(true);
    img.src = `${base}/animations/${name}.webp`;
    return () => { img.onload = null; };
  }, [eager, reduced, name]);
  if (reduced || !animReady) return <img src={`${base}/illustrations/${name}.png`} {...common} fetchPriority={eager ? "high" : undefined} />;
  return (
    <picture>
      <source srcSet={`${base}/animations/${name}.webp`} type="image/webp" />
      <img src={`${base}/animations/gif/${name}.gif`} {...common} />
    </picture>
  );
}

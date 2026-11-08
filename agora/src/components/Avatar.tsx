import { useNavigate } from "react-router-dom";
import { useUser } from "../store/user";

/** Neon circle; shows the profile photo once the person has logged in. */
export function Avatar({ size = 40, asButton = true }: { size?: number; asButton?: boolean }) {
  const { viewer, signedIn } = useUser();
  const nav = useNavigate();
  const photo = signedIn && viewer?.avatarUrl;
  const inner = (
    <span className="block overflow-hidden rounded-full bg-neon" style={{ width: size, height: size }}>
      {photo && <img src={photo} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
    </span>
  );
  if (!asButton) return inner;
  return (
    <button type="button" onClick={() => nav("/profile")} aria-label={signedIn && viewer?.name ? `פרופיל · ${viewer.name}` : "פרופיל"} className="tap inline-flex items-center justify-center rounded-full">
      {inner}
    </button>
  );
}

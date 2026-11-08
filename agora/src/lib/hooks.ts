import { useEffect, useState } from "react";
import { getUserCap } from "../api/platform";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";

/** Run an action that needs a logged-in person (contacting a giver, publishing). */
export function useRequireLogin() {
  const signedIn = useUser((s) => s.signedIn);
  const askLogin = useUI((s) => s.askLogin);
  return (action: () => void) => (signedIn ? action() : askLogin(action));
}

/** Resolve a person's display name from their id at render time (never stored). */
export function usePersonName(id: string | undefined, fallback = "") {
  const [name, setName] = useState("");
  useEffect(() => {
    let alive = true;
    if (!id) return;
    getUserCap().then(async (u) => {
      if (!u?.profiles) return;
      const ps = await u.profiles([id]).catch(() => null);
      const n = ps?.[id]?.name;
      if (alive && n) setName(n);
    });
    return () => { alive = false; };
  }, [id]);
  return name || fallback;
}

export function usePersonAvatar(id: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!id) return;
    getUserCap().then(async (u) => {
      const ps = await u?.profiles?.([id]).catch(() => null);
      if (alive && ps?.[id]?.avatarUrl) setUrl(ps[id].avatarUrl);
    });
    return () => { alive = false; };
  }, [id]);
  return url;
}

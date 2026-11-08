import { create } from "zustand";
import { getDB, getUserCap, type Viewer } from "../api/platform";
import { ls } from "../lib/storage";

interface Profile { signedIn?: boolean; phoneVerified?: boolean; saved?: string[]; city?: string }

interface UserState {
  ready: boolean;
  viewer: Viewer | null;       // identity supplied by the host (id, name, photo)
  signedIn: boolean;           // the person chose to log in to Agora
  phoneVerified: boolean;
  city: string;
  welcomed: boolean;
  init(): Promise<void>;
  signIn(): Promise<boolean>;
  signOut(): Promise<void>;
  verifyPhone(): Promise<void>;
  setCity(c: string): void;
  markWelcomed(): void;
}

let unsub: (() => void) | null = null;
const profileRef = async (id: string) => (await getDB())?.doc(`data/users/${id}/profile`) ?? null;

export const useUser = create<UserState>((set, get) => ({
  ready: false,
  viewer: null,
  signedIn: false,
  phoneVerified: false,
  city: ls.get("agora.city", "רמת גן"),
  // The welcome screen opens every time the app is opened (kept in memory only).
  welcomed: false,

  async init() {
    const cap = await getUserCap();
    const viewer = cap ? await cap.me().catch(() => null) : null;
    set({ viewer: viewer && viewer.id ? viewer : null });
    if (viewer?.id) {
      const ref = await profileRef(viewer.id);
      if (ref) {
        unsub?.();
        let first = true;
        unsub = ref.onSnapshot((s) => {
          const p = (s.exists ? s.data() : {}) as Profile;
          set({ signedIn: !!p.signedIn, phoneVerified: !!p.phoneVerified, ...(p.city ? { city: p.city } : {}) });
          if (first) { first = false; set({ ready: true }); import("./saved").then((m) => m.useSaved.getState().hydrate(p.saved || [])); }
        }, () => set({ ready: true }));
        setTimeout(() => set({ ready: true }), 10000);
        return;
      }
    }
    set({ ready: true });
  },

  async signIn() {
    let v = get().viewer;
    if (!v) {
      const cap = await getUserCap();
      const me = cap ? await cap.me().catch(() => null) : null;
      if (me?.id) { v = me; set({ viewer: me }); }
    }
    if (!v?.id) return false;
    const ref = await profileRef(v.id);
    const { useSaved } = await import("./saved");
    const saved = useSaved.getState().ids;
    await ref?.set({ signedIn: true, phoneVerified: get().phoneVerified, saved, city: get().city }).catch(() => {});
    set({ signedIn: true });
    return true;
  },

  async signOut() {
    const v = get().viewer;
    if (v?.id) await (await profileRef(v.id))?.update({ signedIn: false }).catch(() => {});
    set({ signedIn: false });
  },

  async verifyPhone() {
    const v = get().viewer;
    set({ phoneVerified: true });
    if (v?.id) await (await profileRef(v.id))?.update({ phoneVerified: true }).catch(() => {});
  },

  setCity(city) {
    set({ city });
    ls.set("agora.city", city);
    const v = get().viewer;
    if (v?.id && get().signedIn) profileRef(v.id).then((r) => r?.update({ city }).catch(() => {}));
  },

  markWelcomed() { set({ welcomed: true }); },
}));

/** Save list belongs to the signed-in profile; guests keep it on this device. */
export async function persistSaved(ids: string[]) {
  ls.set("agora.saved", ids);
  const { viewer, signedIn } = useUser.getState();
  if (viewer?.id && signedIn) await (await profileRef(viewer.id))?.update({ saved: ids }).catch(() => {});
}

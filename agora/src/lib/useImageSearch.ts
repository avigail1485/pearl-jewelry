import { useNavigate } from "react-router-dom";
import { useFilters } from "../store/filters";
import { useUI } from "../store/ui";
import { recognize } from "./ai";
import { compress } from "./image";

/** Camera in the search field: recognize the photo and search for that object. */
export function useImageSearch() {
  const nav = useNavigate();
  const set = useFilters((s) => s.set);
  const toast = useUI((s) => s.showToast);
  return async (f: File) => {
    toast("מזהים את התמונה…");
    const guess = await recognize(await compress(f, 640));
    if (guess?.title) {
      set({ q: guess.title.split(" ")[0], categories: [] });
      nav("/results");
    } else {
      toast("לא הצלחנו לזהות. נסו לחפש במילים.");
      nav("/search");
    }
  };
}

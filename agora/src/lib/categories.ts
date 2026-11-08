import {
  Plug, Sofa, BookOpen, Shirt, Bike, Baby, HandHeart, Package, Refrigerator, Tv, Armchair, Lamp, Sprout, Wrench, CookingPot, Puzzle,
  type LucideIcon,
} from "lucide-react";

// The categories used on agora.co.il.
export const CATEGORIES = [
  "ריהוט וכלי בית",
  "מוצרי חשמל",
  "לתינוק ולילד",
  "תחביבים וספורט",
  "ספרים ומדיה",
  "בגדים ואופנה",
  "סיוע חברתי",
  "שונות",
] as const;

export const CONDITIONS = ["כמו חדש", "מצב טוב", "מעט פגום", "לחומר גלם"] as const;
export const SIZES = ["קטן", "בינוני", "גדול"] as const;
export const TIMES = ["בוקר", "צהריים", "ערב", "בתיאום"] as const;
export { CITY_LIST as CITIES } from "./cities";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ריהוט וכלי בית": Sofa, "מוצרי חשמל": Plug, "לתינוק ולילד": Baby, "תחביבים וספורט": Bike,
  "ספרים ומדיה": BookOpen, "בגדים ואופנה": Shirt, "סיוע חברתי": HandHeart, "שונות": Package,
};

// Used when an item has no photo.
export const ICONS: Record<string, LucideIcon> = {
  sofa: Sofa, armchair: Armchair, lamp: Lamp, fridge: Refrigerator, baby: Baby, book: BookOpen, shirt: Shirt,
  plant: Sprout, tool: Wrench, bike: Bike, tv: Tv, pot: CookingPot, box: Package, toy: Puzzle, plug: Plug, heart: HandHeart,
};
export const CATEGORY_ICON: Record<string, string> = {
  "ריהוט וכלי בית": "sofa", "מוצרי חשמל": "plug", "לתינוק ולילד": "baby", "תחביבים וספורט": "bike",
  "ספרים ומדיה": "book", "בגדים ואופנה": "shirt", "סיוע חברתי": "heart", "שונות": "box",
};

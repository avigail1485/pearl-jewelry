import {
  Sofa, Armchair, Lamp, Refrigerator, Baby, BookOpen, Shirt, Sprout, Wrench, Bike, Tv, CookingPot, Package, Puzzle,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  "ריהוט",
  "כלי בית",
  "חשמל ואלקטרוניקה",
  "לתינוק ולילד",
  "ספרים",
  "ביגוד",
  "צמחים וגינה",
  "כלי עבודה",
  "אופניים ותנועה",
  "אחר",
] as const;

export const CONDITIONS = ["כמו חדש", "מצב טוב", "מעט פגום", "לחומר גלם"] as const;
export const SIZES = ["קטן", "בינוני", "גדול"] as const;
export const TIMES = ["בוקר", "צהריים", "ערב", "בתיאום"] as const;
export const CITIES = ["רמת גן", "תל אביב", "גבעתיים", "בני ברק", "פתח תקווה", "ירושלים"] as const;

export const ICONS: Record<string, LucideIcon> = {
  sofa: Sofa, armchair: Armchair, lamp: Lamp, fridge: Refrigerator, baby: Baby, book: BookOpen,
  shirt: Shirt, plant: Sprout, tool: Wrench, bike: Bike, tv: Tv, pot: CookingPot, box: Package, toy: Puzzle,
};

export const CATEGORY_ICON: Record<string, string> = {
  "ריהוט": "sofa", "כלי בית": "pot", "חשמל ואלקטרוניקה": "tv", "לתינוק ולילד": "baby", "ספרים": "book",
  "ביגוד": "shirt", "צמחים וגינה": "plant", "כלי עבודה": "tool", "אופניים ותנועה": "bike", "אחר": "box",
};

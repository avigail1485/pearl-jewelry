import { Recycle, Sparkles, ThumbsUp, Wrench, type LucideIcon } from "lucide-react";

/** One icon per condition — shown on cards instead of a coloured tag. */
export const CONDITION_ICON: Record<string, LucideIcon> = {
  "כמו חדש": Sparkles,
  "מצב טוב": ThumbsUp,
  "מעט פגום": Wrench,
  "לחומר גלם": Recycle,
};
export const conditionIcon = (c: string) => CONDITION_ICON[c] ?? ThumbsUp;

import { ICONS, CATEGORY_ICON } from "../lib/categories";
import type { Item } from "../api/types";

/** Photo when there is one; otherwise the category icon on the gray image surface. */
export function ItemImage({ item, src, iconSize = 56, className = "" }: { item: Item; src?: string; iconSize?: number; className?: string }) {
  const url = src ?? item.thumb;
  const Icon = ICONS[item.icon] ?? ICONS[CATEGORY_ICON[item.category]] ?? ICONS.box;
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden>
          <Icon size={iconSize} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

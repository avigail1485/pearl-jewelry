import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Item } from "../api/types";
import { conditionIcon } from "../lib/conditions";
import { fmtKm } from "../lib/format";
import { ItemImage } from "./ItemImage";
import { SaveButton } from "./SaveButton";

export { fmtKm };

function ConditionBadge({ condition }: { condition: string }) {
  const Icon = conditionIcon(condition);
  return (
    <span role="img" aria-label={`מצב: ${condition}`} title={condition} className="flex h-9 w-9 items-center justify-center rounded-btn-sm bg-white shadow-card">
      <Icon size={18} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

/**
 * Product card, Airbnb-style: only the product, a heart, the condition icon and the city.
 * Everything else lives on the item page.
 */
export function ItemCard({ item, eager, big }: { item: Item; eager?: boolean; big?: boolean }) {
  return (
    <article className="relative" data-reveal>
      <Link to={`/item/${item.id}`} aria-label={`${item.title} · ${item.condition} · ${item.city}`} className="block rounded-tile">
        <ItemImage item={item} eager={eager} iconSize={big ? 72 : 48} className={`${big ? "aspect-[4/3.4]" : "aspect-square"} w-full rounded-tile`} />
        <p className="mt-2 flex items-center gap-1 text-meta">
          <MapPin size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="truncate">{item.city}</span>
        </p>
      </Link>
      <div className="pointer-events-none absolute right-2 top-2"><ConditionBadge condition={item.condition} /></div>
      <div className="absolute left-0 top-0"><SaveButton id={item.id} title={item.title} /></div>
    </article>
  );
}

export const ItemTile = ItemCard;

export function ItemGrid({ items }: { items: Item[] }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-5">{items.map((i) => <ItemCard key={i.id} item={i} />)}</div>;
}

export function ItemFeed({ items }: { items: Item[] }) {
  return <div className="flex flex-col gap-6">{items.map((i, n) => <ItemCard key={i.id} item={i} big eager={n < 1} />)}</div>;
}

export function Carousel({ items }: { items: Item[] }) {
  return (
    <ul className="no-scrollbar -mx-gutter flex snap-x gap-3 overflow-x-auto scroll-px-gutter px-gutter pb-1">
      {items.map((i) => <li key={i.id} className="w-[156px] shrink-0 snap-start"><ItemCard item={i} /></li>)}
    </ul>
  );
}

import { Link } from "react-router-dom";
import type { Item } from "../api/types";
import { fmtKm, timeAgo } from "../lib/format";
import { isNew } from "../store/items";
import { ItemImage } from "./ItemImage";
import { SaveButton } from "./SaveButton";
import { Tag } from "./Tag";

export { fmtKm };

/** Compact tile — carousels and the 2-column grid. */
export function ItemTile({ item, className = "" }: { item: Item; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Link to={`/item/${item.id}`} className="block rounded-tile">
        <ItemImage item={item} className="aspect-[169/170] w-full rounded-tile" />
        <div className="mt-2 space-y-0.5">
          <h3 className="truncate text-body font-demibold">{item.title}</h3>
          <p className="truncate text-meta text-ink/65">{item.city} · {fmtKm(item.distanceKm)}</p>
          <p className="truncate text-meta text-ink/65">{item.condition}</p>
        </div>
      </Link>
      {isNew(item) && <Tag tone="neon" className="pointer-events-none absolute right-2 top-2">חדש</Tag>}
      <div className="absolute left-0 top-0"><SaveButton id={item.id} title={item.title} /></div>
    </div>
  );
}

/** Large listing card — the main feed and results list. */
export function ItemCard({ item, eager }: { item: Item; eager?: boolean }) {
  return (
    <article className="relative">
      <Link to={`/item/${item.id}`} className="block rounded-tile">
        <ItemImage item={item} eager={eager} iconSize={72} className="aspect-[4/3.4] w-full rounded-tile" />
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-body font-demibold">{item.title}</h3>
            <p className="truncate text-body text-ink/65">{item.subcategory || item.category} · {item.city}</p>
            <p className="truncate text-body text-ink/65">{fmtKm(item.distanceKm)} ממך · {timeAgo(item.createdAt)}</p>
            <p className="mt-1 text-body font-demibold underline underline-offset-4">בחינם</p>
          </div>
          <Tag className="mt-0.5 shrink-0">{item.condition}</Tag>
        </div>
      </Link>
      {isNew(item) && <Tag tone="neon" className="pointer-events-none absolute right-3 top-3">חדש</Tag>}
      <div className="absolute left-1 top-1"><SaveButton id={item.id} title={item.title} /></div>
    </article>
  );
}

export function ItemRow({ item }: { item: Item }) {
  return (
    <div className="relative">
      <Link to={`/item/${item.id}`} className="flex gap-3 rounded-tile py-2">
        <ItemImage item={item} iconSize={36} className="h-[93px] w-[93px] shrink-0 rounded-tile" />
        <div className="min-w-0 flex-1 space-y-1 py-1 pl-10">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-body font-demibold">{item.title}</h3>
            {isNew(item) && <Tag tone="neon">חדש</Tag>}
          </div>
          <p className="truncate text-meta text-ink/65">{item.city} · {fmtKm(item.distanceKm)}</p>
          <Tag>{item.condition}</Tag>
        </div>
      </Link>
      <div className="absolute left-0 top-2"><SaveButton id={item.id} title={item.title} floating={false} /></div>
    </div>
  );
}

export function ItemGrid({ items }: { items: Item[] }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-6">{items.map((i) => <ItemTile key={i.id} item={i} />)}</div>;
}

export function ItemFeed({ items }: { items: Item[] }) {
  return <div className="flex flex-col gap-8">{items.map((i, n) => <ItemCard key={i.id} item={i} eager={n < 1} />)}</div>;
}

export function Carousel({ items }: { items: Item[] }) {
  return (
    <ul className="no-scrollbar -mx-gutter flex snap-x gap-3 overflow-x-auto scroll-px-gutter px-gutter pb-1">
      {items.map((i) => <li key={i.id} className="w-[150px] shrink-0 snap-start"><ItemTile item={i} /></li>)}
    </ul>
  );
}

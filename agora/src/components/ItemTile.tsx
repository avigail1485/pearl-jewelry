import { Link } from "react-router-dom";
import type { Item } from "../api/types";
import { isNew } from "../store/items";
import { ItemImage } from "./ItemImage";
import { SaveButton } from "./SaveButton";
import { Tag } from "./Tag";

export const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} מ'` : `${km.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ק"מ`);

export function ItemTile({ item, className = "" }: { item: Item; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Link to={`/item/${item.id}`} className="block rounded-tile">
        <ItemImage item={item} className="aspect-[169/170] w-full rounded-tile" />
        <div className="mt-2 space-y-1">
          <h3 className="truncate text-body font-demibold">{item.title}</h3>
          <p className="truncate text-meta text-ink/65">{item.city} · {fmtKm(item.distanceKm)}</p>
          <Tag>{item.condition}</Tag>
        </div>
      </Link>
      {isNew(item) && <Tag tone="neon" className="absolute right-2 top-2">חדש</Tag>}
      <div className="absolute left-0 top-0"><SaveButton id={item.id} title={item.title} /></div>
    </div>
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
  return <div className="grid grid-cols-2 gap-4">{items.map((i) => <ItemTile key={i.id} item={i} />)}</div>;
}

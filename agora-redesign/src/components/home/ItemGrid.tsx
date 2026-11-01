import type { FeedItem } from "../../data/mock"
import ItemCard from "./ItemCard"

export default function ItemGrid({ items }: { items: FeedItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

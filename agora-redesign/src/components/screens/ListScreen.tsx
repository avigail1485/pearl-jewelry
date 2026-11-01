import type { FeedItem } from "../../data/mock"
import ScreenHeader from "../ui/ScreenHeader"
import ResultsList from "./ResultsList"

export default function ListScreen({ title, items }: { title: string; items: FeedItem[] }) {
  return (
    <div className="flex flex-col">
      <ScreenHeader title={title} />
      <div className="px-5 pt-1 pb-6">
        <ResultsList items={items} />
      </div>
    </div>
  )
}

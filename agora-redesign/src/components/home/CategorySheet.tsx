import { Plug, Sofa, BookOpen, Shirt, Dumbbell, Baby, HandHeart, Package } from "lucide-react"
import { categories } from "../../data/mock"
import Sheet from "../ui/Sheet"

export const categoryIcons: Record<string, typeof Plug> = {
  plug: Plug, sofa: Sofa, "book-open": BookOpen, shirt: Shirt, dumbbell: Dumbbell, baby: Baby, "hand-heart": HandHeart, package: Package,
}

export default function CategorySheet({ onClose, onPick }: { onClose: () => void; onPick: (label: string) => void }) {
  return (
    <Sheet title="כל הקטגוריות" onClose={onClose}>
      <div className="grid grid-cols-4 gap-x-2 gap-y-5">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.icon] ?? Package
          return (
            <button key={cat.id} type="button" onClick={() => onPick(cat.label)} className="group flex flex-col items-center gap-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-strong transition-colors group-hover:bg-brand group-hover:text-paper">
                <Icon size={22} />
              </span>
              <span className="text-[12px] font-medium leading-tight text-deep">{cat.label}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

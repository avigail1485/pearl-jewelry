// Real content sourced from agora.co.il (item titles, cities, categories, stats).

export type Condition = "כמו חדש" | "במצב טוב" | "דורש תיקון"
export type ItemStatus = "available" | "given"

export type FeedItem = {
  id: string
  title: string
  city: string
  distanceKm: number
  postedLabel: string
  condition: Condition
  photoCount: number
  status: ItemStatus
  category: string
  photo: string
  description?: string
  tags?: string[]
  interestCount?: number
  giver?: Giver
}

export type Giver = {
  name: string
  since: number
  givenCount: number
  phoneVerified: boolean
}

const defaultGiver: Giver = { name: "משה", since: 2019, givenCount: 24, phoneVerified: true }

export function itemDetail(item: FeedItem) {
  return {
    ...item,
    description:
      item.description ??
      "פריט במצב שמור, נמסר בגלל מעבר דירה. אפשר לתאם איסוף בהמשך השבוע. מגיע כמו שרואים בתמונות.",
    tags: item.tags ?? [item.condition, "נדרש רכב"],
    interestCount: item.interestCount ?? 4,
    giver: item.giver ?? defaultGiver,
  }
}

const img = (url: string, w = 640) => `${url}&w=${w}&h=${Math.round((w * 3) / 4)}&fit=crop`

export const categories: { id: string; label: string; icon: string }[] = [
  { id: "electronics", label: "מוצרי חשמל", icon: "plug" },
  { id: "furniture", label: "ריהוט וכלי בית", icon: "sofa" },
  { id: "books", label: "ספרים ומדיה", icon: "book-open" },
  { id: "clothing", label: "בגדים ואופנה", icon: "shirt" },
  { id: "hobbies", label: "תחביבים וספורט", icon: "dumbbell" },
  { id: "kids", label: "לתינוק ולילד", icon: "baby" },
  { id: "social", label: "סיוע חברתי", icon: "hand-heart" },
  { id: "misc", label: "שונות", icon: "package" },
]

export const searchChips = ["ריהוט", "מיטה", "שולחן", "לתינוק", "כלי אוכל", "שידה"]

export const cities = ["תל אביב-יפו", "ירושלים", "בני ברק", "רמת גן", "פתח תקווה", "חיפה", "כפר סבא", "יבנה", "בית שמש", "אשדוד"]

export const feedItems: FeedItem[] = [
  { id: "1", title: "שידת עץ עם 4 מגירות", city: "רמת גן", distanceKm: 3, postedLabel: "לפני שעה", condition: "כמו חדש", photoCount: 4, status: "available", category: "ריהוט וכלי בית",
    photo: img("https://images.unsplash.com/photo-1544691560-fc2053d97726?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
  { id: "2", title: "מיטת יחיד", city: "כפר סבא", distanceKm: 5, postedLabel: "לפני 3 שעות", condition: "במצב טוב", photoCount: 6, status: "available", category: "ריהוט וכלי בית",
    photo: img("https://images.unsplash.com/photo-1721742736307-1eed2fc2d56e?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
  { id: "3", title: "שולחן כתיבה", city: "תל אביב-יפו", distanceKm: 7, postedLabel: "לפני 5 שעות", condition: "דורש תיקון", photoCount: 3, status: "available", category: "ריהוט וכלי בית",
    photo: img("https://images.unsplash.com/photo-1761116182930-8c82e7e9d873?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
  { id: "4", title: "מחבתות", city: "בן שמן", distanceKm: 2, postedLabel: "אתמול", condition: "כמו חדש", photoCount: 2, status: "given", category: "ריהוט וכלי בית",
    photo: img("https://images.unsplash.com/photo-1518291344630-4857135fb581?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
  { id: "5", title: "סט כלי אוכל חלקי", city: "תל אביב-יפו", distanceKm: 6, postedLabel: "אתמול", condition: "במצב טוב", photoCount: 5, status: "available", category: "ריהוט וכלי בית",
    photo: img("https://images.unsplash.com/photo-1614548539644-ef528186523a?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
  { id: "6", title: "עגלת תינוק", city: "יבנה", distanceKm: 4, postedLabel: "לפני יומיים", condition: "במצב טוב", photoCount: 3, status: "available", category: "לתינוק ולילד",
    photo: img("https://images.unsplash.com/photo-1714392512700-4cab9e51710b?crop=entropy&cs=tinysrgb&fm=jpg&q=80") },
]

// Prototype feed: repeat the sample items to reach a realistic length
export const previewFeed: FeedItem[] = Array.from({ length: 20 }, (_, i) => {
  const base = feedItems[i % feedItems.length]
  return { ...base, id: `${base.id}-${i}` }
})

export type OpenRequest = { id: string; title: string; person: string; postedLabel: string; city: string }

export const openRequests: OpenRequest[] = [
  { id: "r1", title: "מיטת תינוק", person: "נחום מחיפה", postedLabel: "לפני יומיים", city: "חיפה" },
  { id: "r2", title: "מכונת כביסה", person: "רון מפתח תקווה", postedLabel: "לפני יום", city: "פתח תקווה" },
  { id: "r3", title: "שולחן כתיבה", person: "דוד מתל אביב", postedLabel: "לפני 4 שעות", city: "תל אביב-יפו" },
  { id: "r4", title: "מקרר קטן", person: "אבי מרמת גן", postedLabel: "לפני שעה", city: "רמת גן" },
]

export const impact = { total: "1,162,919", thisWeek: 312 }

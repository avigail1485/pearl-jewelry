export type Condition = "כמו חדש" | "מצב טוב" | "מעט פגום" | "לחומר גלם"

export type Item = {
  id: string
  title: string
  city: string
  region: string
  posted: string
  condition: Condition
  category: string
  sub: string
  description: string
  photo: string
  giver: string
  url: string
}

export type WantedRequest = { id: string; title: string; city: string; posted: string }

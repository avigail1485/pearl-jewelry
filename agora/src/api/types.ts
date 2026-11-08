export interface Seller { id: string; name: string; given: number }
export interface Item {
  id: string;
  title: string;
  category: string;
  icon?: string;
  condition: string;
  city: string;
  /** computed from the viewer's area */
  distanceKm: number;
  createdAt: number;
  size: string;
  times: string[];
  stairs: boolean;
  description: string;
  seller: Seller;
  status: "active" | "given";
  /** small JPEG data URL for tiles (user-published items) */
  thumb?: string;
  /** photo shipped with the app (demo catalogue from agora.co.il) */
  photo?: string;
  /** photo has a transparent background (shown as a product shot) */
  cutout?: boolean;
  subcategory?: string;
  region?: string;
  floor?: number | null;
  elevator?: boolean | null;
  disassembly?: string | null;
  dims?: string | null;
  /** the original listing on agora.co.il */
  source?: string;
  ownerId?: string;
  demo?: boolean;
}
export interface Thread {
  id: string;
  itemId: string;
  itemTitle: string;
  participants: string[];
  buyerId: string;
  sellerId: string;
  /** set for demo sellers (not real accounts) */
  demoSellerName?: string;
  lastText: string;
  updatedAt: number;
}
export interface Message { id: string; from: string; text: string; at: number }

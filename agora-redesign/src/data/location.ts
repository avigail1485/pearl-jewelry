/**
 * Location without a network call: the device position is matched to the nearest town in this
 * table, and distances are measured town-to-town. Precise coordinates never leave the device.
 * Coordinates are town centres (approximate, good enough for "how far is the pickup").
 */
export const towns: Record<string, [number, number]> = {
  "תל אביב-יפו": [32.0853, 34.7818],
  "ירושלים": [31.7683, 35.2137],
  "חיפה": [32.794, 34.9896],
  "בני ברק": [32.0807, 34.8338],
  "רמת גן": [32.0823, 34.8106],
  "גבעתיים": [32.0722, 34.8125],
  "פתח תקווה": [32.084, 34.8878],
  "ראשון לציון": [31.973, 34.7925],
  "חולון": [32.0158, 34.7874],
  "בת ים": [32.0231, 34.7503],
  "הרצליה": [32.1663, 34.8433],
  "רעננה": [32.1848, 34.8713],
  "כפר סבא": [32.175, 34.9069],
  "הוד השרון": [32.15, 34.888],
  "רמת השרון": [32.1461, 34.8394],
  "נתניה": [32.3215, 34.8532],
  "קרית אונו": [32.0636, 34.8553],
  "ראש העין": [32.0956, 34.9566],
  "אלעד": [32.0522, 34.951],
  "רחובות": [31.8928, 34.8113],
  "גדרה": [31.8136, 34.7778],
  "אשדוד": [31.8014, 34.6435],
  "אשקלון": [31.6688, 34.5743],
  "קרית גת": [31.61, 34.7642],
  "בית שמש": [31.747, 34.9881],
  "מודיעין": [31.898, 35.0104],
  "מודיעין עילית": [31.933, 35.044],
  "ביתר עילית": [31.696, 35.115],
  "חדרה": [32.434, 34.9196],
  "עפולה": [32.6078, 35.2897],
  "טבריה": [32.7959, 35.531],
  "צפת": [32.9646, 35.496],
  "כרמיאל": [32.919, 35.295],
  "נהריה": [33.0089, 35.0981],
  "כפר חנניה": [32.9076, 35.4111],
  "באר שבע": [31.252, 34.7915],
  "אילת": [29.5577, 34.9519],
}

export const townNames = Object.keys(towns)

export type GeoPoint = { lat: number; lng: number }

export function distanceKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function townPoint(town: string): GeoPoint | null {
  const t = towns[town]
  return t ? { lat: t[0], lng: t[1] } : null
}

export function nearestTown(p: GeoPoint) {
  let best = townNames[0]
  let bestD = Infinity
  for (const name of townNames) {
    const d = distanceKm(p, townPoint(name)!)
    if (d < bestD) {
      bestD = d
      best = name
    }
  }
  return { town: best, km: bestD }
}

/** Km from the viewer to a town, rounded for display; null when either side is unknown. */
export function kmTo(from: GeoPoint | null, town: string) {
  const to = townPoint(town)
  if (!from || !to) return null
  return Math.max(1, Math.round(distanceKm(from, to)))
}

export type LocateError = "denied" | "unavailable" | "timeout" | "unsupported"

/** One-shot device position. Never throws: resolves to a point or an error code. */
export function getDevicePosition(): Promise<{ ok: true; point: GeoPoint } | { ok: false; error: LocateError }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ ok: false, error: "unsupported" })
    let settled = false
    const done = (v: { ok: true; point: GeoPoint } | { ok: false; error: LocateError }) => {
      if (!settled) {
        settled = true
        resolve(v)
      }
    }
    // Some browsers never call back when the prompt is dismissed; give up after 12s.
    const guard = window.setTimeout(() => done({ ok: false, error: "timeout" }), 12000)
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.clearTimeout(guard)
          done({ ok: true, point: { lat: pos.coords.latitude, lng: pos.coords.longitude } })
        },
        (err) => {
          window.clearTimeout(guard)
          done({ ok: false, error: err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable" })
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
      )
    } catch {
      window.clearTimeout(guard)
      done({ ok: false, error: "unavailable" })
    }
  })
}

export const locateErrorCopy: Record<LocateError, string> = {
  denied: "הגישה למיקום חסומה. אפשר לבחור עיר במקום, או לאפשר מיקום בהגדרות הדפדפן.",
  unavailable: "לא הצלחנו לזהות את המיקום כרגע. אפשר לבחור עיר במקום.",
  timeout: "זיהוי המיקום לוקח יותר מדי זמן. אפשר לבחור עיר במקום.",
  unsupported: "המכשיר לא תומך בזיהוי מיקום. אפשר לבחור עיר במקום.",
}

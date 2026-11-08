import { CITY_COORDS } from "./cities";

/** Ask the device for its position and return the nearest known city (or null). */
export function detectCity(): Promise<string | null> {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    const t = setTimeout(() => res(null), 12000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearTimeout(t);
        let best: string | null = null, bestD = Infinity;
        for (const [c, [lat, lng]] of Object.entries(CITY_COORDS)) {
          const d = (lat - coords.latitude) ** 2 + ((lng - coords.longitude) * Math.cos((lat * Math.PI) / 180)) ** 2;
          if (d < bestD) { bestD = d; best = c; }
        }
        res(bestD < 0.5 ? best : null); // only inside the area we know
      },
      () => { clearTimeout(t); res(null); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}

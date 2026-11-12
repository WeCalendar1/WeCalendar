import { NextResponse } from "next/server";
import {
  labelNominatimHit,
  mergePlaceSearchHits,
  nominatimSearchUrl,
  photonSearchFocus,
  type NominatimHit,
  type PlaceSearchHit,
} from "@/lib/places";

const OSM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "WeCalendar/1.0 (https://github.com/WeCalendar1/WeCalendar)",
};

const CACHE_TTL_MS = 5 * 60_000;
const searchCache = new Map<string, { at: number; hits: PlaceSearchHit[] }>();

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: OSM_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchNominatim(url: string): Promise<NominatimHit[]> {
  const json = await fetchJson(url, 2_500);
  return Array.isArray(json) ? (json as NominatimHit[]) : [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ hits: [] });
  }

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const focus =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? photonSearchFocus({ lat, lng }, null)
      : null;
  const cacheKey = `${q.toLowerCase()}|${focus ? `${focus.lat.toFixed(2)},${focus.lng.toFixed(2)}` : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ hits: cached.hits });
  }

  const nominatimHits = (await fetchNominatim(nominatimSearchUrl(q, focus?.bbox))).map(
    labelNominatimHit,
  );
  const hits = mergePlaceSearchHits([nominatimHits], focus, 5);
  if (hits.length > 0) searchCache.set(cacheKey, { at: Date.now(), hits });
  return NextResponse.json({ hits });
}

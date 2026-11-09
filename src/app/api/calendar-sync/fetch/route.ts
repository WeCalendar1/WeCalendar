import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPrivateOrReservedIp, validateExternalIcsUrl } from "@/lib/calendarSync";

const MAX_ICS_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (typeof body.url !== "string") {
    return NextResponse.json({ error: "Missing calendar URL." }, { status: 400 });
  }

  const validation = validateExternalIcsUrl(body.url);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const parsedUrl = new URL(validation.url);
  try {
    const resolved = await lookup(parsedUrl.hostname, { all: true });
    if (
      resolved.length === 0 ||
      resolved.some((entry) => isPrivateOrReservedIp(entry.address))
    ) {
      return NextResponse.json(
        { error: "Calendar URL resolves to a restricted network address." },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not resolve calendar hostname." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(validation.url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1",
        "User-Agent": "WeCalendar-ICS-Sync/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Calendar feed returned HTTP ${response.status}.` },
        { status: 422 },
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Empty calendar feed response." }, { status: 422 });
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > MAX_ICS_BYTES) {
          await reader.cancel();
          return NextResponse.json(
            { error: "Calendar feed exceeds the 2 MB size limit." },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const icsText = new TextDecoder("utf-8").decode(combined);
    if (!/BEGIN:VCALENDAR/i.test(icsText)) {
      return NextResponse.json(
        { error: "The URL did not return a valid iCalendar (.ics) feed." },
        { status: 422 },
      );
    }

    return NextResponse.json({ icsText });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch external calendar feed (timeout, redirect, or network error)." },
      { status: 422 },
    );
  }
}

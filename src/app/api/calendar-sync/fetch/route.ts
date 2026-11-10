import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request as httpsRequest } from "node:https";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  selectPinnedLookupAddresses,
  validateExternalIcsUrl,
} from "@/lib/calendarSync";

const MAX_ICS_BYTES = 2 * 1024 * 1024; // 2 MB
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

type HopResult =
  | { kind: "redirect"; location: string }
  | { kind: "ok"; icsText: string }
  | { kind: "error"; status: number; message: string };

function createPinnedSsrfLookup(): typeof dnsLookup {
  const pinnedLookup = ((
    hostname: string,
    options: unknown,
    callback?: (
      err: NodeJS.ErrnoException | null,
      address: string | LookupAddress[],
      family?: number,
    ) => void,
  ) => {
    const cb = typeof options === "function" ? options : callback;
    const opts =
      typeof options === "object" && options !== null
        ? (options as { all?: boolean })
        : {};

    dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) {
        cb?.(err, "", 4);
        return;
      }
      const checked = selectPinnedLookupAddresses(addresses);
      if (!checked.ok) {
        const dnsErr: NodeJS.ErrnoException = new Error(checked.message);
        dnsErr.code = checked.code;
        cb?.(dnsErr, "", 4);
        return;
      }

      if (opts.all) {
        cb?.(null, checked.addresses);
      } else {
        const first = checked.addresses[0]!;
        cb?.(null, first.address, first.family);
      }
    });
  }) as typeof dnsLookup;

  return pinnedLookup;
}

function fetchSingleHopPinned(targetUrl: URL): Promise<HopResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: HopResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = httpsRequest(
      {
        protocol: "https:",
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method: "GET",
        servername: targetUrl.hostname,
        lookup: createPinnedSsrfLookup(),
        timeout: FETCH_TIMEOUT_MS,
        headers: {
          Host: targetUrl.host,
          Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1",
          "User-Agent": "WeCalendar-ICS-Sync/1.0",
          "Accept-Encoding": "identity",
        },
      },
      (res) => {
        const statusCode = res.statusCode ?? 0;

        if (REDIRECT_STATUS_CODES.has(statusCode)) {
          const location = res.headers.location;
          res.resume();
          if (!location || typeof location !== "string") {
            finish({
              kind: "error",
              status: 422,
              message: "Calendar feed returned an invalid redirect.",
            });
            return;
          }
          finish({ kind: "redirect", location });
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          res.resume();
          finish({
            kind: "error",
            status: 422,
            message: `Calendar feed returned HTTP ${statusCode}.`,
          });
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.byteLength;
          if (totalBytes > MAX_ICS_BYTES) {
            req.destroy();
            finish({
              kind: "error",
              status: 413,
              message: "Calendar feed exceeds the 2 MB size limit.",
            });
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          if (settled) return;
          const icsText = Buffer.concat(chunks, totalBytes).toString("utf-8");
          if (!/BEGIN:VCALENDAR/i.test(icsText)) {
            finish({
              kind: "error",
              status: 422,
              message: "The URL did not return a valid iCalendar (.ics) feed.",
            });
            return;
          }
          finish({ kind: "ok", icsText });
        });

        res.on("error", () => {
          finish({
            kind: "error",
            status: 422,
            message: "Failed to read external calendar feed response.",
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      finish({
        kind: "error",
        status: 422,
        message: "Timed out while fetching external calendar feed.",
      });
    });

    req.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ESSRFBLOCKED") {
        finish({
          kind: "error",
          status: 400,
          message: "Calendar URL resolves to a restricted network address.",
        });
        return;
      }
      if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
        finish({
          kind: "error",
          status: 400,
          message: "Could not resolve calendar hostname.",
        });
        return;
      }
      finish({
        kind: "error",
        status: 422,
        message: "Failed to fetch external calendar feed.",
      });
    });

    req.end();
  });
}

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

  let currentValidation = validateExternalIcsUrl(body.url);
  if (!currentValidation.ok) {
    return NextResponse.json({ error: currentValidation.error }, { status: 400 });
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const targetUrl = new URL(currentValidation.url);
    const result = await fetchSingleHopPinned(targetUrl);

    if (result.kind === "ok") {
      return NextResponse.json({ icsText: result.icsText });
    }

    if (result.kind === "error") {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    if (hop === MAX_REDIRECTS) {
      return NextResponse.json(
        { error: "Calendar feed exceeded maximum redirect hops." },
        { status: 422 },
      );
    }

    let nextRawUrl: string;
    try {
      nextRawUrl = new URL(result.location, targetUrl).toString();
    } catch {
      return NextResponse.json(
        { error: "Calendar feed returned an invalid redirect URL." },
        { status: 422 },
      );
    }

    currentValidation = validateExternalIcsUrl(nextRawUrl);
    if (!currentValidation.ok) {
      return NextResponse.json(
        { error: `Redirect blocked: ${currentValidation.error}` },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { error: "Failed to fetch external calendar feed." },
    { status: 422 },
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow the app to boot before Supabase env vars are configured.
  if (!url || !key || url.includes("your-project")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the auth session from the cookie - no network round trip needed here.
  // getUser() would make a live Supabase call on every request (causes huge latency
  // on cold/paused projects). getSession() reads the signed JWT from the cookie and
  // is sufficient for route-guard purposes.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(redirectUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname.startsWith("/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}

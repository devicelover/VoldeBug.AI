import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@web/lib/auth";
import { env } from "@web/lib/env";

// All HTTP verbs forward through the same handler. Adding a verb? Add it
// here AND in the backend Express router or it will 404 silently.
export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}
export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}
export async function PATCH(request: NextRequest) {
  return handleRequest(request, "PATCH");
}
export async function PUT(request: NextRequest) {
  return handleRequest(request, "PUT");
}
export async function DELETE(request: NextRequest) {
  return handleRequest(request, "DELETE");
}

async function handleRequest(request: NextRequest, method: string) {
  // auth() is the canonical NextAuth v5 server-side reader. It uses the
  // same NextAuth instance as the rest of the app, so cookie name +
  // secret always match. getToken() (which we used briefly) was returning
  // null on live sessions; auth() does not have that problem.
  //
  // session.user.token holds the backend bearer — see the trade-off note
  // in @web/lib/auth.ts for why we accept that on Session.
  const session = await auth();
  const u = session?.user as
    | { id?: string; role?: string; token?: string }
    | undefined;

  // Defense-in-depth: if auth() somehow returned nothing, try getToken
  // as a secondary source.
  type FallbackToken = { id?: string; role?: string; backendToken?: string };
  let fallbackToken: FallbackToken | null = null;
  if (!u?.id) {
    try {
      const t = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      });
      fallbackToken = t as FallbackToken | null;
    } catch {
      fallbackToken = null;
    }
  }

  const userId = u?.id ?? fallbackToken?.id;
  const userRole = u?.role ?? fallbackToken?.role ?? "";
  const backendToken = u?.token ?? fallbackToken?.backendToken;

  if (!userId) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  // Callers in api-client.ts already prefix paths with /v1 — see all
  // hooks/*. The proxy just strips the /api/proxy prefix; never re-add
  // /v1 here or you get /v1/v1/... and the backend 404s. (Real bug
  // reported by the school admin trying to save settings.)
  const proxyPath = url.pathname.replace(/^\/api\/proxy/, "");
  const backendUrl = `${env.NEXT_PUBLIC_API_URL}${proxyPath}${url.search}`;
  const body = method !== "GET" ? await request.text() : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
    "X-User-Role": userRole,
  };
  if (backendToken) {
    headers["Authorization"] = `Bearer ${backendToken}`;
  }

  const res = await fetch(backendUrl, {
    method,
    headers,
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

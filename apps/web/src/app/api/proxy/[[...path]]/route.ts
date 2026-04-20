import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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
  // Read the full encrypted JWT (server-side only). Unlike auth(), this gives
  // us the backend bearer token that we deliberately keep OFF the client
  // session — see apps/web/src/lib/auth.ts for the rationale.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
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
  const proxyPath = url.pathname.replace(/^\/api\/proxy/, "/v1");
  const backendUrl = `${env.NEXT_PUBLIC_API_URL}${proxyPath}${url.search}`;
  const body = method !== "GET" ? await request.text() : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": token.id,
    "X-User-Role": (token.role as string) ?? "",
  };
  if (token.backendToken) {
    headers["Authorization"] = `Bearer ${token.backendToken}`;
  }

  const res = await fetch(backendUrl, {
    method,
    headers,
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/role-select"];
const PUBLIC_PREFIXES = [
  "/onboarding",
  "/api",
  "/_next",
  "/favicon",
  // Parent consent flow is reached via an unauthenticated email link.
  "/consent",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // If not logged in, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role-based gating ─────────────────────────────────────────────────
  // Each role has their "home" dashboard:
  //   STUDENT  → /dashboard/student
  //   TEACHER  → /dashboard/teacher
  //   ADMIN    → /dashboard/admin (also reaches /dashboard/principal/*)
  //
  // Cross-role pages (lesson-plans, ai-chat, ai-log, settings, etc.)
  // are accessible to all logged-in users.
  const role = req.auth.user?.role;
  const isStudentRoute =
    pathname.startsWith("/dashboard/student") ||
    pathname.startsWith("/dashboard/classroom") ||
    pathname.startsWith("/dashboard/scoreboard");
  const isTeacherRoute = pathname.startsWith("/dashboard/teacher");
  const isAdminRoute =
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/dashboard/principal");

  // Bounce wrong-role users to their home.
  if (role === "STUDENT" && (isTeacherRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/dashboard/student", req.nextUrl));
  }
  if (role === "TEACHER" && (isStudentRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/dashboard/teacher", req.nextUrl));
  }
  if (role === "ADMIN" && isStudentRoute) {
    // Admins land on their own dashboard, not the student one. Teachers
    // can still see their teacher area; admin pages are explicit.
    return NextResponse.redirect(new URL("/dashboard/admin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

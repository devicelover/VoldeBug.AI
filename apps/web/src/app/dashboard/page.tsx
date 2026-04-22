import { redirect } from "next/navigation";
import { auth } from "@web/lib/auth";

// Role-aware landing page for /dashboard. NextAuth knows the user's role
// (set during sign-in via the jwt callback in @web/lib/auth.ts), so we
// can route them to the correct sub-dashboard server-side without a
// flicker. Was previously an unconditional redirect to
// /dashboard/student which dumped admins/teachers in the wrong place
// after Google OAuth login (the credentials login was role-aware in
// the form handler but the OAuth path skipped that).
export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  switch (role) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "TEACHER":
      redirect("/dashboard/teacher");
    case "STUDENT":
      redirect("/dashboard/student");
    default:
      // No session or unrecognised role → middleware will bounce to login.
      redirect("/login");
  }
}

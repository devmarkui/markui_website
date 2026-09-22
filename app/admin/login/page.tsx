import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import { hasCredentials } from "@/lib/admin-account";
import { getSession } from "@/lib/auth";

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const params = await props.searchParams;
  const raw = params.next;
  const next = typeof raw === "string" ? raw : "/admin";
  const safeNext = next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  // Already signed in (with a session that is still current): skip the form.
  if (await getSession()) redirect(safeNext);

  return (
    <LoginForm
      next={safeNext}
      showDefaultHint={
        !(await hasCredentials()) && process.env.NODE_ENV !== "production"
      }
    />
  );
}

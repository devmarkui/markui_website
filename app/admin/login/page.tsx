import LoginForm from "@/components/admin/LoginForm";
import { hasConfiguredCredentials } from "@/lib/auth-token";

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const params = await props.searchParams;
  const raw = params.next;
  const next = typeof raw === "string" ? raw : "/admin";

  return (
    <LoginForm
      next={next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin"}
      showDefaultHint={
        !hasConfiguredCredentials() && process.env.NODE_ENV !== "production"
      }
    />
  );
}

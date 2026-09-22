import AccountForm from "@/components/admin/AccountForm";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin-account";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAccountPage() {
  const session = await requireAdmin("/admin/account");

  return <AccountForm username={session.u} passwordMinLength={PASSWORD_MIN_LENGTH} />;
}

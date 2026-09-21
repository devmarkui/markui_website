import Link from "next/link";

import { logout } from "@/app/admin/actions";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

/**
 * Everything in this route group is behind authentication. The Proxy already
 * turns anonymous visitors away, but this is the check that actually matters:
 * it runs on the server for every dashboard render.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();

  return (
    <>
      <header className="ad-header">
        <Link href="/admin" className="ad-brand">
          Mark UI<sup>®</sup>
          <span className="ad-brand-tag">Admin</span>
        </Link>

        <div className="ad-header-right">
          <span className="ad-user">Signed in as {session.u}</span>
          <Link
            href="/"
            className="ad-btn ad-btn--sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            View site ↗
          </Link>
          <form action={logout}>
            <button className="ad-btn ad-btn--sm" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="ad-shell">
        <AdminNav />
        <main className="ad-main">{children}</main>
      </div>
    </>
  );
}

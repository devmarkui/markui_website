import { notFound } from "next/navigation";

/** Deeper paths under a project don't exist; they get the Vault's 404, not the main site's. */
export default function VaultDeepPath() {
  notFound();
}

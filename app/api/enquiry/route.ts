import { NextResponse } from "next/server";

import { submitEnquiry } from "@/app/actions/enquiry";

/**
 * JSON entry point to the enquiry flow for the static homepage in
 * `public/landing/`, which cannot call a Server Action. It hands the body to
 * `submitEnquiry`, so validation, rate limiting, storage and the notification
 * email are exactly the same as the React forms'.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read that submission." }, { status: 400 });
  }

  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : "");

  const result = await submitEnquiry({
    source: "home",
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    message: text("message"),
    website: text("website"),
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

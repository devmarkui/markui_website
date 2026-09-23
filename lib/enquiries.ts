import { randomUUID } from "node:crypto";

import { withClient, type DbClient } from "./mysql-store";
import {
  ENQUIRY_LIMITS,
  type Enquiry,
  type EnquirySource,
} from "./types";
import type { RowDataPacket } from "mysql2/promise";

/**
 * Reading and writing the `enquiries` table.
 *
 * These go straight to SQL rather than through `lib/db.ts`, which loads and
 * rewrites the whole site in one transaction — fine for a handful of pages,
 * wrong for a table that grows with every visitor.
 */

export interface EnquiryInput {
  source: EnquirySource;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  message?: string;
}

/** Trims a field and cuts it to the column's length. */
function clip(value: string | undefined, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

function toEnquiry(row: RowDataPacket): Enquiry {
  return {
    id: row.id as string,
    source: row.source as EnquirySource,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    company: row.company as string,
    service: row.service as string,
    message: row.message as string,
    emailed: Boolean(row.emailed),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

/** Saves a submission. The caller emails it afterwards and marks it sent. */
export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const enquiry: Enquiry = {
    id: randomUUID(),
    source: input.source,
    name: clip(input.name, ENQUIRY_LIMITS.name),
    email: clip(input.email, ENQUIRY_LIMITS.email),
    phone: clip(input.phone, ENQUIRY_LIMITS.phone),
    company: clip(input.company, ENQUIRY_LIMITS.company),
    service: clip(input.service, ENQUIRY_LIMITS.service),
    message: clip(input.message, ENQUIRY_LIMITS.message),
    emailed: false,
    createdAt: new Date().toISOString(),
  };

  await withClient(async (client: DbClient) => {
    await client.query(
      "INSERT INTO enquiries (id, source, name, email, phone, company, service, message, emailed, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        enquiry.id,
        enquiry.source,
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.company,
        enquiry.service,
        enquiry.message,
        false,
        new Date(enquiry.createdAt),
      ],
    );
  });

  return enquiry;
}

/** Called once the notification email has actually left the server. */
export async function markEnquiryEmailed(id: string): Promise<void> {
  await withClient(async (client: DbClient) => {
    await client.query("UPDATE enquiries SET emailed = TRUE WHERE id = ?", [id]);
  });
}

/** Newest first, for the dashboard. */
export async function getEnquiries(limit = 200): Promise<Enquiry[]> {
  return withClient(async (client: DbClient) => {
    const [rows] = await client.query<RowDataPacket[]>(
      "SELECT * FROM enquiries ORDER BY created_at DESC LIMIT ?",
      [limit],
    );
    return rows.map(toEnquiry);
  });
}

export async function deleteEnquiry(id: string): Promise<void> {
  await withClient(async (client: DbClient) => {
    await client.query("DELETE FROM enquiries WHERE id = ?", [id]);
  });
}

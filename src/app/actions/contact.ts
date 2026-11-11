"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/server/email";
import { allow } from "@/lib/server/rate-limit";
import { site } from "@/lib/site";
import { escapeHtml as esc } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  topic: z.enum(["order", "product", "return", "partnership", "other"]),
  message: z.string().trim().min(10).max(2000),
  /** honeypot: real people never fill this hidden field */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.input<typeof contactSchema>;

/** Sends a contact-form message to the shop inbox. */
export async function sendContactMessage(input: ContactInput): Promise<{ ok: boolean; fields?: string[] }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fields: parsed.error.issues.map((i) => String(i.path[0])) };
  if (!(await allow("contact"))) return { ok: false, fields: [] };
  const { name, email, topic, message } = parsed.data;
  await sendEmail({
    to: process.env.CONTACT_INBOX || site.email,
    subject: `[Contact · ${topic}] ${name}`,
    html: `<p><b>${esc(name)}</b> &lt;${esc(email)}&gt;</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`,
  });
  return { ok: true };
}

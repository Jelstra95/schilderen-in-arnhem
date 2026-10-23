import "server-only";
import { Resend } from "resend";

/**
 * Thin wrapper around Resend. Three guarantees callers can rely on:
 *  1. It never throws — a failed send resolves to {ok: false, error}. Callers
 *     log the error but should not fail the HTTP response, because durable DB
 *     writes happen first.
 *  2. In dev / preview environments without RESEND_API_KEY it logs the message
 *     to the server console instead of sending, so the flow is still testable.
 *  3. Sender address is read from RESEND_FROM and must be on a verified domain.
 */

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(args: SendEmailArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    // Dev fallback: log, don't send. Still returns ok so callers downstream
    // don't treat local dev as a failure.
    console.info("[email:dry-run]", {
      from,
      to: args.to,
      subject: args.subject,
      replyTo: args.replyTo,
      textPreview: args.text.slice(0, 200),
    });
    return { ok: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return { ok: false, error: message };
  }
}

/** Escapes a string for safe interpolation into an HTML email body. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { sendResendEmail } from "@/lib/resend";

const RESEND_API_URL = "https://api.resend.com";
const FORWARD_TO = "hgjaustin@gmail.com";

interface ReceivedEmail {
  id: string;
  from: string;
  to?: string[];
  subject?: string;
  html?: string | null;
  text?: string | null;
  reply_to?: string[] | null;
}

interface ReceivedAttachment {
  filename: string;
  download_url?: string;
}

function getApiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY.");
  return key;
}

async function resendGet<T>(path: string): Promise<T> {
  const response = await fetch(`${RESEND_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Resend GET failed: ${response.status}`,
    );
  }

  return body as T;
}

export async function forwardReceivedResendEmail(event: {
  type?: string;
  created_at?: string;
  data?: { email_id?: string };
}) {
  if (event.type !== "email.received" || !event.data?.email_id) {
    return { forwarded: false };
  }

  const emailId = String(event.data.email_id);

  const email = await resendGet<ReceivedEmail>(
    `/emails/receiving/${encodeURIComponent(emailId)}`,
  );

  let attachments: Array<{ path: string; filename: string }> = [];

  try {
    const result = await resendGet<{ data?: ReceivedAttachment[] }>(
      `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
    );

    attachments = (result.data ?? [])
      .filter((attachment) => attachment.download_url && attachment.filename)
      .map((attachment) => ({
        path: attachment.download_url!,
        filename: attachment.filename,
      }));
  } catch (error) {
    console.error("Could not retrieve inbound attachments", error);
  }

  const subject = email.subject?.trim() || "(no subject)";
  const originalFrom = email.from || "unknown sender";
  const bodyText =
    email.text?.trim() ||
    "This email did not contain a plain-text body. See the HTML version below.";

  await sendResendEmail({
    from: process.env.EMAIL_FROM ?? "Diabetes App <onboarding@resend.dev>",
    to: [FORWARD_TO],
    subject: `Fwd: ${subject}`,
    text: [
      "---------- Forwarded email ----------",
      `From: ${originalFrom}`,
      `To: ${(email.to ?? []).join(", ") || "unknown"}`,
      `Date: ${event.created_at ?? "unknown"}`,
      `Subject: ${subject}`,
      "",
      bodyText,
    ].join("\n"),
    ...(email.html ? { html: email.html } : {}),
    ...(email.reply_to?.length ? { reply_to: email.reply_to } : {}),
    ...(attachments.length ? { attachments } : {}),
  });

  return { forwarded: true, emailId };
}

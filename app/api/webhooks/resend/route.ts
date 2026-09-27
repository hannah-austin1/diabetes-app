import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const RESEND_API_URL = "https://api.resend.com";
const FORWARD_TO = "hgjaustin@gmail.com";

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

async function resendSend(email: {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  reply_to?: string[];
  attachments?: Array<{ path: string; filename: string }>;
}) {
  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Resend send failed: ${response.status}`,
    );
  }
  return body;
}

function verifyResendWebhook(payload: string, headers: Headers) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing RESEND_WEBHOOK_SECRET.");

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const age = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!Number.isFinite(age) || age > 5 * 60 * 1000) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");

  return signatureHeader.split(" ").some((value) => {
    const signature = Buffer.from(value.replace(/^v1,/, ""));
    const expectedBytes = Buffer.from(expected);
    return (
      signature.length === expectedBytes.length &&
      timingSafeEqual(signature, expectedBytes)
    );
  });
}

interface ReceivedEmail {
  id: string;
  from: string;
  to?: string[];
  cc?: string[];
  subject?: string;
  html?: string | null;
  text?: string | null;
  reply_to?: string[] | null;
  message_id?: string | null;
}

interface ReceivedAttachment {
  filename: string;
  content_type?: string;
  download_url?: string;
}

export async function POST(request: Request) {
  const payload = await request.text();

  if (!verifyResendWebhook(payload, request.headers)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);

    if (event?.type === "email.received" && event.data?.email_id) {
      const emailId = String(event.data.email_id);

      // The webhook contains metadata; retrieve the actual received email first.
      const email = await resendGet<ReceivedEmail>(
        `/emails/receiving/${encodeURIComponent(emailId)}`,
      );

      // Retrieve attachment download URLs so the forwarded message can include them.
      let attachments: Array<{ path: string; filename: string }> = [];
      try {
        const result = await resendGet<{ data?: ReceivedAttachment[] }>(
          `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
        );
        attachments = (result.data ?? [])
          .filter((a) => a.download_url && a.filename)
          .map((a) => ({
            path: a.download_url!,
            filename: a.filename,
          }));
      } catch (error) {
        // Don't lose the email if attachment retrieval fails.
        console.error("Could not retrieve inbound attachments", error);
      }

      const subject = email.subject?.trim() || "(no subject)";
      const originalFrom = email.from || "unknown sender";
      const bodyText =
        email.text?.trim() ||
        "This email did not contain a plain-text body. See the HTML version below.";

      await resendSend({
        from: process.env.EMAIL_FROM ?? "Diabetes App <onboarding@resend.dev>",
        to: [FORWARD_TO],
        subject: `Fwd: ${subject}`,
        text: [
          `---------- Forwarded email ----------`,
          `From: ${originalFrom}`,
          `To: ${(email.to ?? []).join(", ") || "unknown"}`,
          `Date: ${event.created_at ?? "unknown"}`,
          `Subject: ${subject}`,
          "",
          bodyText,
        ].join("\n"),
        ...(email.html ? { html: email.html } : {}),
        ...(email.reply_to?.length
          ? { reply_to: email.reply_to }
          : { reply_to: [originalFrom] }),
        ...(attachments.length ? { attachments } : {}),
      });

      console.info("Forwarded inbound Resend email", {
        emailId,
        to: FORWARD_TO,
        subject,
        attachmentCount: attachments.length,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend inbound forwarding failed", error);
    return NextResponse.json({ error: "Inbound email forwarding failed." }, { status: 500 });
  }
}

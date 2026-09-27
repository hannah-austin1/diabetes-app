import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

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
    return signature.length === expectedBytes.length &&
      timingSafeEqual(signature, expectedBytes);
  });
}

export async function POST(request: Request) {
  const payload = await request.text();

  if (!verifyResendWebhook(payload, request.headers)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = JSON.parse(payload);

  switch (event?.type) {
    case "email.received":
      console.info("Resend inbound email", {
        emailId: event.data?.email_id ?? null,
        messageId: event.data?.message_id ?? null,
        from: event.data?.from ?? null,
        subject: event.data?.subject ?? null,
      });
      break;
    case "email.delivered":
    case "email.bounced":
    case "email.complained":
    case "email.suppressed":
      console.info("Resend email event", {
        type: event.type,
        emailId: event.data?.email_id ?? null,
      });
      break;
  }

  return NextResponse.json({ received: true });
}

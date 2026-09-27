import { NextResponse } from "next/server";
import {
  forwardReceivedResendEmail,
  verifyResendWebhook,
} from "@/lib/resend-actions";

export async function POST(request: Request) {
  const payload = await request.text();

  if (!verifyResendWebhook(payload, request.headers)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  try {
    await forwardReceivedResendEmail(JSON.parse(payload));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend inbound forwarding failed", error);
    return NextResponse.json(
      { error: "Inbound email forwarding failed." },
      { status: 500 },
    );
  }
}

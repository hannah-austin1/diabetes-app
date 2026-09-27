"use server";

import { sendResendEmail } from "@/lib/resend";

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Diabetes App <onboarding@resend.dev>";
const EMAIL_TO = process.env.EMAIL_TO;

export interface SendEmailInput {
  subject: string;
  text: string;
  html?: string;
  to?: string | string[];
  replyTo?: string | string[];
}

export async function sendEmail({
  subject,
  text,
  html,
  to,
  replyTo,
}: SendEmailInput) {
  const recipients = to ?? EMAIL_TO;

  if (!recipients) {
    throw new Error("Missing EMAIL_TO environment variable.");
  }

  return sendResendEmail({
    from: EMAIL_FROM,
    to: recipients,
    subject,
    text,
    ...(html ? { html } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
}

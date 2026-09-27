const RESEND_API_URL = "https://api.resend.com/emails";

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY environment variable.");
  return key;
}

export interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  reply_to?: string | string[];
}

export async function sendResendEmail(email: ResendEmail) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
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
        : "Resend failed to send the email.",
    );
  }

  return body as { id: string };
}

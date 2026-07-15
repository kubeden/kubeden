/* Transactional mail through smtpfa.st's REST API — a plain fetch, no SDK.
   Without SMTPFAST_API_KEY (local dev) messages print to the server log, so
   the whole auth flow works before mail is wired up. Returns booleans, never
   throws: a failed send is a user-visible "try again", not a 500. */

const SMTPFAST_URL = "https://smtpfa.st/api/v1/emails";

/* set these for the host app */
const APP_NAME = "App";
const fromAddress = () =>
  process.env.MAIL_FROM ?? `${APP_NAME} <no-reply@example.com>`;

export const mailConfigured = () => Boolean(process.env.SMTPFAST_API_KEY);

/* email-safe shell: inline styles only — restyle to the host brand */
function shell(body: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f6f4;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
      <p style="font-size:24px;margin:0 0 28px;">${APP_NAME}</p>
      ${body}
    </div>
  </body>
</html>`;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  if (!mailConfigured()) {
    console.log(`[mail:dev] to=${to} · "${subject}"\n${text}`);
    return true;
  }
  try {
    const res = await fetch(SMTPFAST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SMTPFAST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok && process.env.NODE_ENV !== "production") {
      /* dev with a real key but e.g. an unverified domain (403) — surface
         the provider's complaint, then fall back to the log so local auth
         flows keep working while DNS propagates */
      console.warn(`[mail:dev] smtpfa.st ${res.status}: ${await res.text()}`);
      console.log(`[mail:dev] to=${to} · "${subject}"\n${text}`);
      return true;
    }
    return res.ok;
  } catch {
    return false;
  }
}

/* The code email. Deliberate choices: the code IS the subject (most users
   act from the notification without opening the mail); big monospaced code
   in the body; expiry and the no-action line stated; NO links — auth emails
   with links train the exact clicking habit phishing depends on. */
export function sendLoginCode(email: string, code: string) {
  return send(
    email,
    `${code} is your ${APP_NAME} sign-in code`,
    shell(`
      <p style="font-size:16px;line-height:1.6;margin:0 0 20px;">Here's your sign-in code:</p>
      <p style="font-size:40px;letter-spacing:0.3em;font-family:Menlo,Consolas,monospace;margin:0 0 20px;">${code}</p>
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0;">It expires in 10 minutes. If you didn't ask for it, ignore this email — nothing happens without the code.</p>
    `),
    `Your ${APP_NAME} sign-in code: ${code}\nIt expires in 10 minutes. If you didn't ask for it, ignore this email.`,
  );
}

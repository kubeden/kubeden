"use client";

/* Passwordless sign-in, two steps in one component: email → six-digit code.
   First-timers get their account minted on a verified code — the same form
   serves login and signup, so never present separate ones. Styling here is
   neutral Tailwind; restyle to the host design system, keep the behavior:
   one-time-code autofill, paste fan-out, resend, different-email. */

import { useActionState, useRef, useState } from "react";
import { requestLoginCode, verifyLoginCode } from "@/lib/auth-actions";

const CODE_LENGTH = 6;

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </p>
  );
}

/* Six boxes, one digit each — auto-advance, backspace walks left, and a
   pasted code fans out across all of them. autoComplete="one-time-code" on
   the first box lets iOS/Android offer the code from the notification. */
function CodeBoxes({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");

  const write = (next: string[]) => onChange(next.join(""));

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          value={digit}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            const next = [...digits];
            next[i] = ch;
            write(next);
            if (ch && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, CODE_LENGTH);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            refs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
          }}
          className="size-12 rounded-lg border border-gray-300 bg-white text-center font-mono text-xl focus:border-gray-900 focus:outline-none"
        />
      ))}
    </div>
  );
}

export default function EmailOtpForm() {
  const [requestState, requestAction, requesting] = useActionState(
    requestLoginCode,
    undefined,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyLoginCode,
    undefined,
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [editingEmail, setEditingEmail] = useState(true);

  const sent = Boolean(requestState && "sent" in requestState) && !editingEmail;
  const requestError =
    requestState && "error" in requestState ? requestState.error : undefined;
  const verifyError =
    verifyState && "error" in verifyState ? verifyState.error : undefined;

  if (!sent) {
    return (
      <form
        action={(fd) => {
          setEditingEmail(false);
          setCode("");
          requestAction(fd);
        }}
        className="grid gap-5"
      >
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-gray-900 focus:outline-none"
          />
        </label>
        {requestError && <ErrorNote message={requestError} />}
        <button
          type="submit"
          disabled={requesting}
          className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white disabled:cursor-wait disabled:opacity-60"
        >
          {requesting ? "Sending…" : "Email me a code"}
        </button>
        <p className="text-center text-xs text-gray-500">
          No password — a six-digit code lands in your inbox.
        </p>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-gray-600">
        We sent a six-digit code to{" "}
        <span className="font-medium text-gray-900">{email}</span>. It expires
        in 10 minutes.
      </p>
      <form action={verifyAction} className="grid gap-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="code" value={code} />
        <CodeBoxes value={code} onChange={setCode} />
        {verifyError && <ErrorNote message={verifyError} />}
        <button
          type="submit"
          disabled={verifying || code.length !== CODE_LENGTH}
          className="rounded-lg bg-gray-900 px-6 py-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? "Checking…" : "Sign in"}
        </button>
      </form>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setEditingEmail(true);
            setCode("");
          }}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Different email
        </button>
        {/* resend silently invalidates the previous code — one live code
            per email, always */}
        <form
          action={(fd) => {
            setCode("");
            requestAction(fd);
          }}
        >
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={requesting}
            className="text-sm font-medium text-gray-900 underline disabled:opacity-60"
          >
            {requesting ? "Sending…" : "Resend code"}
          </button>
        </form>
      </div>
      {requestError && <ErrorNote message={requestError} />}
    </div>
  );
}

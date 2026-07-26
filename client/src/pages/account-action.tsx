import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, KeyRound, LockKeyhole, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Mode = "request" | "reset" | "activate";

const copy: Record<Mode, { title: string; description: string; submit: string }> = {
  request: {
    title: "Reset your staff password",
    description: "Enter your work email and we will send a secure reset link if an active account matches it.",
    submit: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    description: "Use at least 8 characters, including uppercase, lowercase, a number, and a special character.",
    submit: "Reset password",
  },
  activate: {
    title: "Activate your UCH account",
    description: "Create your staff password. You will enrol multi-factor authentication after your first sign-in.",
    submit: "Activate account",
  },
};

export default function AccountActionPage() {
  const mode = useMemo<Mode>(() => {
    if (window.location.pathname === "/activate-account") return "activate";
    if (window.location.pathname === "/reset-password") return "reset";
    return "request";
  }, []);
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(token || mode === "request" ? "" : "This secure link is missing its token. Request a new one from your administrator.");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const content = copy[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode !== "request" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = mode === "request"
        ? await apiRequest("POST", "/api/auth/password-reset/request", { email })
        : await apiRequest(
          "POST",
          mode === "reset" ? "/api/auth/password-reset/confirm" : "/api/auth/staff-invitations/activate",
          mode === "reset" ? { token, newPassword: password } : { token, password },
        );
      const body = await response.json();
      setSuccess(body.message || "Your request has been completed.");
    } catch (err: any) {
      setError((err.message || "Unable to complete this request.").replace(/^\d+:\s*/, ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-950/5">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">Universal Credit Hub</p>
            <p className="text-sm text-slate-500">Secure staff access</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">All set</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{success}</p>
            </div>
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-900 px-5 text-sm font-semibold text-white hover:bg-blue-800">Go to staff sign-in</Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={submit}>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{content.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{content.description}</p>
            </div>

            {mode === "request" ? (
              <label className="block text-sm font-medium text-slate-700">
                Work email
                <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  New password
                  <div className="relative mt-1.5">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input className="h-11 w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  </div>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Confirm new password
                  <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                </label>
              </>
            )}

            {error && <p role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}

            <button className="h-11 w-full rounded-lg bg-blue-900 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || (!!error && !token && mode !== "request")}>{loading ? "Please wait…" : content.submit}</button>
            <p className="text-center text-sm text-slate-600"><Link href="/login" className="font-medium text-blue-800 hover:underline">Return to staff sign-in</Link></p>
          </form>
        )}
      </section>
    </main>
  );
}

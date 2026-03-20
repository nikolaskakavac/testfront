"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setSuccess("");
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8 || password.length > 32) {
      setSuccess("");
      setError("Password must be between 8 and 32 characters.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setSuccess("");
      setError("Password must contain at least one uppercase letter and one number.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          mfa: false,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        setError(message || "Signup failed.");
        return;
      }

      setSuccess(message || "User registration successful!");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Ne mogu da se povezem sa backendom.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[color:var(--text)]">
      <div className="w-full max-w-5xl overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] shadow-[var(--shadow-soft)] backdrop-blur-xl md:grid md:grid-cols-[0.95fr_1.05fr]">
        <section className="border-b border-[color:var(--line)] bg-[var(--surface-2)] p-8 sm:p-10 md:border-b-0 md:border-r">
          <div className="rounded-[28px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <div>
              <p className="text-2xl font-bold text-[color:var(--text-strong)]">Create profile</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">Create your profile and start rating.</p>
            </div>

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                Password rules: 8-32 characters, at least one uppercase letter, and at least one number.
              </div>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              {error ? (
                <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="motion-button button-primary w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating profile..." : "Create profile"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-orange-300 hover:text-red-300">
                Login
              </Link>
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-between p-8 sm:p-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-2)] shadow-[var(--shadow-card)] ring-1 ring-[color:var(--line)]">
                <span className="brand-text-gradient text-lg font-black">R</span>
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-[color:var(--text-strong)]">Rater</p>
                <p className="text-xs text-[color:var(--muted)]">Back to the feed</p>
              </div>
            </Link>

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
              Join the app
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">
              Build your profile.
              <span className="block brand-text-gradient">Drop your first take today.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
              Track every score, climb the leaderboard, and let people discover what you rate best.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">Personal stats</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Save your ratings, favorite categories, and streak progress in one profile.
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,56,20,0.18)] bg-[linear-gradient(135deg,rgba(255,244,194,0.12),rgba(255,186,77,0.14),rgba(255,48,22,0.12))] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Early access</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                New users get featured prompts, curated categories, and faster leaderboard visibility.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
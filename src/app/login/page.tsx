"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        setError(message || "Login failed.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Ne mogu da se povezem sa backendom.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[color:var(--text)]">
      <div className="w-full max-w-5xl overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] shadow-[var(--shadow-soft)] backdrop-blur-xl md:grid md:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between p-8 sm:p-10">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,6,8,0.92),rgba(13,11,15,0.94))] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.34)]">
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
              Welcome back
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">
              Login and jump
              <span className="block brand-text-gradient">straight into the ratings.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
              Follow the hottest drops, save your takes, and keep your score history in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[rgba(7,7,9,0.82)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <p className="text-[color:var(--muted)]">Active users</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--text-strong)]">28k</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(7,7,9,0.82)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <p className="text-[color:var(--muted)]">Ratings today</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--text-strong)]">18.4k</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(7,7,9,0.82)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <p className="text-[color:var(--muted)]">Live debates</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--text-strong)]">241</p>
            </div>
          </div>
        </section>

        <section className="border-t border-[color:var(--line)] p-8 sm:p-10 md:border-l md:border-t-0">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,6,8,0.92),rgba(13,11,15,0.94))] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-[color:var(--text-strong)]">Sign in</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Use your account to continue.</p>
              </div>
              <div className="rounded-full border border-[rgba(255,148,58,0.22)] bg-[rgba(255,148,58,0.14)] px-3 py-1 text-xs font-medium text-orange-300">
                Secure
              </div>
            </div>

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
              />
              {error ? (
                <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-orange-500" />
                  Remember me
                </label>
                <button type="button" className="transition hover:text-[color:var(--text-strong)]">
                  Forgot?
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="motion-button button-primary w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[color:var(--muted)]">
              New here?{" "}
              <Link href="/signup" className="font-semibold text-orange-300 hover:text-red-300">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}






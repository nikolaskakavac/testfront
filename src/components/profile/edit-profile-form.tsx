"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EditProfileFormProps = {
  initialUsername: string;
  initialEmail: string;
};

export default function EditProfileForm({
  initialUsername,
  initialEmail,
}: EditProfileFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setError(data.message || "Ne mogu da sacuvam izmene.");
        return;
      }

      setMessage("Profil je uspesno sacuvan.");
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Ne mogu da sacuvam izmene trenutno.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setError("");
    setMessage("");
    setIsOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          setUsername(initialUsername);
          setEmail(initialEmail);
          setError("");
          setMessage("");
          setIsOpen((prev) => !prev);
        }}
        className="motion-button button-primary min-w-[150px] justify-center self-stretch px-5"
      >
        {isOpen ? "Close editor" : "Edit profile"}
      </button>

      {message ? (
        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[28px] border border-[color:var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] xl:absolute xl:right-8 xl:top-[9.5rem] xl:z-20 xl:w-[360px]"
        >
          <p className="text-sm font-semibold text-[color:var(--text-strong)]">Edit profile</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Update your username and email. Changes apply right after saving.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Username
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--line-strong)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--line-strong)]"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="motion-button button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="motion-button button-secondary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

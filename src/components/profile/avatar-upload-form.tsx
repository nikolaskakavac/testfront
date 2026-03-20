"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AvatarUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const file = formData.get("avatar");

      if (!(file instanceof File) || file.size === 0) {
        setError("Izaberi sliku pre cuvanja.");
        return;
      }

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message || "Upload nije uspeo.");
        return;
      }

      setMessage(data.message || "Profilna je sacuvana.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      router.refresh();
    } catch {
      setError("Ne mogu da uploadujem sliku trenutno.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message || "Brisanje nije uspelo.");
        return;
      }

      setMessage(data.message || "Profilna je uklonjena.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      router.refresh();
    } catch {
      setError("Ne mogu da uklonim sliku trenutno.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4 text-sm text-[color:var(--muted)]">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Profile photo</span>
        <span className="mt-2 block">PNG, JPG ili WEBP. Ako ne postavis sliku, videce se user ikonica.</span>
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          className="mt-3 block w-full text-sm text-[color:var(--text)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface-2)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--text-strong)]"
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting || isRemoving}
          className="motion-button button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save profile photo"}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isSubmitting || isRemoving}
          className="motion-button button-secondary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRemoving ? "Removing..." : "Remove photo"}
        </button>
      </div>
    </form>
  );
}

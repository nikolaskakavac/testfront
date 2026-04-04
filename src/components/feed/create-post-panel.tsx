"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CreatePostPayload = {
  title: string;
  description: string;
  category: string;
  tags: string;
};

const initialState: CreatePostPayload = {
  title: "",
  description: "",
  category: "",
  tags: "",
};

export default function CreatePostPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [form, setForm] = useState<CreatePostPayload>(initialState);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setIsExpanded(true);
    }
  }, [searchParams]);

  function toggleExpanded(nextValue: boolean) {
    setIsExpanded(nextValue);

    if (pathname !== "/") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set("compose", "1");
      router.replace(`/?${params.toString()}#create-post`, { scroll: false });
      return;
    }

    params.delete("compose");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/?${nextQuery}` : "/", { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("tags", form.tags);

      Array.from(files ?? []).forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let parsedMessage = "";

      try {
        const data = JSON.parse(rawText) as { message?: string };
        parsedMessage = data.message ?? "";
      } catch {
        parsedMessage = rawText.trim();
      }

      if (!response.ok) {
        setError(parsedMessage || "Create post failed.");
        return;
      }

      setMessage(parsedMessage || "Post created.");
      setForm(initialState);
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toggleExpanded(false);
      router.refresh();
    } catch {
      setError("Ne mogu da kreiram post trenutno.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="create-post"
      className="rounded-[28px] border border-[color:var(--line)] bg-[rgba(7,7,9,0.88)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/90">Create</p>
          <h3 className="mt-1 text-xl font-bold text-[color:var(--text-strong)]">Drop a new thing to rate</h3>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Upload slika je sada direktan, bez lepljenja linka.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleExpanded(!isExpanded)}
          className="motion-button button-primary shrink-0"
        >
          {isExpanded ? "Close" : "New post"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isExpanded ? (
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
          />

          <label className="block rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-4 text-sm text-[color:var(--muted)]">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Images</span>
            <span className="mt-2 block">Dodaj jednu ili vise slika sa kompa.</span>
            <input
              ref={fileInputRef}
              type="file"
              name="images"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(event) => setFiles(event.target.files)}
              className="mt-3 block w-full text-sm text-[color:var(--text)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface-2)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--text-strong)]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
            />
            <input
              type="text"
              placeholder="Tags: sneakers, streetwear"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
            />
          </div>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-[rgba(3,3,5,0.86)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="motion-button button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Publishing..." : "Publish post"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfilePost = {
  id: string;
  title: string;
  category: string;
  score: number;
  imageUrl: string;
};

type ProfilePostsGridProps = {
  posts: ProfilePost[];
  canDelete?: boolean;
};

export default function ProfilePostsGrid({ posts, canDelete = true }: ProfilePostsGridProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(postId: string) {
    setRemovingId(postId);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(data.message || "Delete failed.");
        return;
      }

      router.refresh();
    } catch {
      setError("Ne mogu da obrisem post trenutno.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[var(--subtle-bg)] shadow-[var(--shadow-card)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  disabled={removingId === post.id}
                  className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {removingId === post.id ? "Deleting..." : "Delete"}
                </button>
              ) : null}
            </div>
            <div className="space-y-2 px-4 py-4">
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{post.title}</p>
              <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                <span>{post.category}</span>
                <span className="rounded-full border border-[color:var(--line)] px-2 py-1 text-[color:var(--text-strong)]">
                  {post.score}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import Avatar from "@/components/user/avatar";
import { getAvatarUrl } from "@/lib/user-avatar";
import type { PostRater } from "@/types";

type BackendRater = {
  id: string;
  value: number;
  createdAt?: string;
  created_at?: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    avatar_url?: string;
  };
};

type PostRatingsSheetProps = {
  postId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
};

function mapRaters(items: BackendRater[]): PostRater[] {
  return items.map((item) => ({
    id: item.id,
    value: Number(item.value ?? 0),
    createdAt: item.createdAt ?? item.created_at,
    user: {
      id: item.user?.id ?? "unknown",
      username: item.user?.username ?? "anonymous",
      avatarUrl: getAvatarUrl(item.user?.avatarUrl ?? item.user?.avatar_url) ?? undefined,
    },
  }));
}

export default function PostRatingsSheet({
  postId,
  title,
  isOpen,
  onClose,
}: PostRatingsSheetProps) {
  const [raters, setRaters] = useState<PostRater[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadRaters = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts/${postId}/ratings`, {
          cache: "no-store",
        });

        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          ratings?: BackendRater[];
        };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load ratings.");
        }

        if (!cancelled) {
          setRaters(mapRaters(Array.isArray(data.ratings) ? data.ratings : []));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load ratings.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRaters();

    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#090607] shadow-[0_24px_68px_rgba(0,0,0,0.52)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-200/65">Who rated</p>
              <p className="mt-1 truncate text-lg font-bold text-[color:var(--text-strong)]">{title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/10 hover:text-white"
              aria-label="Close ratings list"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="h-4 w-4">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          {isLoading ? <p className="text-sm text-[color:var(--muted)]">Loading ratings...</p> : null}

          {!isLoading && error ? (
            <p className="text-sm font-semibold text-orange-200/80">{error}</p>
          ) : null}

          {!isLoading && !error && raters.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No ratings yet.</p>
          ) : null}

          {!isLoading && !error && raters.length > 0 ? (
            <div className="space-y-3">
              {raters.map((rater, index) => (
                <div
                  key={rater.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] font-bold text-orange-200/80">
                      {index + 1}
                    </div>
                    <Avatar username={rater.user.username} avatarUrl={rater.user.avatarUrl} size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">@{rater.user.username}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        {rater.createdAt ? new Date(rater.createdAt).toLocaleDateString("en-GB") : "Rated recently"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full border border-orange-300/18 bg-black/35 px-3 py-1.5 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200/65">Score</p>
                    <p className="text-lg font-black leading-none text-white">{rater.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

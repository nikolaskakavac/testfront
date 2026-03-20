"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PostCard from "@/components/feed/post-card";
import type { Post } from "@/types";

type FavoritesFeedProps = {
  initialPosts: Post[];
};

export default function FavoritesFeed({ initialPosts }: FavoritesFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const removeFavorite = async (postId: string) => {
    if (removingId) {
      return;
    }

    setRemovingId(postId);

    try {
      const response = await fetch(`/api/posts/${postId}/favorite`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove favorite.");
      }

      setPosts((current) => current.filter((post) => post.id !== postId));
      router.refresh();
    } catch {
      return;
    } finally {
      setRemovingId(null);
    }
  };

  if (!posts.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {posts.map((post) => (
        <div key={post.id} className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeFavorite(post.id)}
              disabled={removingId === post.id}
              className="inline-flex items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removingId === post.id ? "Removing..." : "Remove"}
            </button>
          </div>
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}

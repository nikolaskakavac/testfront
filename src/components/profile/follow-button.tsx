"use client";

import { useState } from "react";

type FollowButtonProps = {
  userId: string;
  initialFollowing: boolean;
  initialFollowers: number;
  isOwnProfile?: boolean;
};

export default function FollowButton({
  userId,
  initialFollowing,
  initialFollowers,
  isOwnProfile = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [isLoading, setIsLoading] = useState(false);

  if (isOwnProfile) {
    return null;
  }

  const handleToggle = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      const data = (await response.json().catch(() => ({}))) as {
        following?: boolean;
        followers?: number;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Follow request failed.");
      }

      setIsFollowing(Boolean(data.following));
      setFollowers(typeof data.followers === "number" ? data.followers : followers);
    } catch {
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3 text-center shadow-[var(--shadow-card)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Followers</p>
        <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{followers}</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={isFollowing ? "motion-button button-secondary" : "motion-button button-primary"}
      >
        {isLoading ? "Working..." : isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

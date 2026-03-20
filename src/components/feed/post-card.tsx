"use client";

import Image from "next/image";
import { useState } from "react";
import type { Post } from "@/types";
import PostModal from "./post-modal";
import PostRatingsSheet from "./post-ratings-sheet";
import RatingSlider from "./rating-slider";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(post.userRating ?? post.score);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState<number>(Math.round(post.score));
  const [displayVotes, setDisplayVotes] = useState<number>(post.votes);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [isRatingsSheetOpen, setIsRatingsSheetOpen] = useState(false);
  const cardClassName = isSliderVisible
    ? "motion-card group grid h-[520px] cursor-pointer grid-rows-[42%_58%] overflow-visible rounded-[20px] bg-black backdrop-blur-[10px] shadow-[0_18px_44px_rgba(26,9,9,0.48)] transition duration-300 ease-out hover:shadow-[0_26px_58px_rgba(33,10,9,0.58)] md:h-[640px] md:grid-rows-[44%_56%]"
    : "motion-card group grid h-[380px] cursor-pointer grid-rows-[56%_44%] overflow-visible rounded-[20px] bg-black backdrop-blur-[10px] shadow-[0_18px_44px_rgba(26,9,9,0.48)] transition duration-300 ease-out hover:shadow-[0_26px_58px_rgba(33,10,9,0.58)] md:h-[440px] md:grid-rows-[58%_42%]";

  const submitRating = async (value: number) => {
    if (isSavingRating) {
      return;
    }

    setIsSavingRating(true);
    setRatingMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        score?: number;
        votes?: number;
        userRating?: number;
      };

      if (!response.ok) {
        throw new Error(data.message || "Rating save failed.");
      }

      setSelectedRating(typeof data.userRating === "number" ? data.userRating : value);
      setDisplayScore(typeof data.score === "number" ? Math.round(data.score) : displayScore);
      setDisplayVotes(typeof data.votes === "number" ? data.votes : displayVotes);
      setRatingMessage("Rating saved");
      setIsSliderVisible(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rating save failed.";
      setRatingMessage(message);
    } finally {
      setIsSavingRating(false);
      window.setTimeout(() => setRatingMessage(null), 2200);
    }
  };

  const renderStars = (value: number, activeClass = "text-amber-300", emptyClass = "text-white/20") =>
    Array.from({ length: 5 }).map((_, idx) => {
      const nextRating = (idx + 1) * 20;
      return (
        <button
          key={idx}
          type="button"
          className="rounded-sm transition duration-200 hover:scale-105 hover:brightness-110"
          data-prevent-modal="true"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedRating(nextRating);
            setIsSliderVisible(true);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Rate ${idx + 1} star${idx === 0 ? "" : "s"}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`h-5 w-5 ${idx < value ? activeClass : emptyClass}`}
          >
            <path d="m12 2.8 2.8 5.68 6.27.91-4.53 4.42 1.07 6.25L12 17.05 6.39 20.06l1.07-6.25L2.93 9.39l6.27-.91L12 2.8Z" />
          </svg>
        </button>
      );
    });

  const images = post.images?.length ? post.images : [post.imageUrl];

  return (
    <>
      <article
        className={cardClassName}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${post.title}`}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-prevent-modal="true"]')) {
            return;
          }
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-prevent-modal="true"]')) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <div className="relative z-0 h-full w-full overflow-hidden rounded-t-[20px] bg-black">
          <Image
            src={images[0]}
            alt={post.title}
            fill
            sizes="(max-width: 1280px) 100vw, 560px"
            className="object-cover transition duration-300 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/78 via-black/45 to-transparent opacity-95" />
          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-black/16" />
            <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/95 backdrop-blur-sm">
              View
            </div>
          </div>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-start overflow-hidden rounded-b-[20px] bg-black px-5 py-4">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-[0.01em] text-[color:var(--text-strong)]">{post.title}</p>
              <div
                className="mt-1 inline-flex items-center gap-0.5"
                data-prevent-modal="true"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                aria-label="Rate with stars"
                aria-expanded={isSliderVisible}
              >
                {renderStars(Math.max(1, Math.min(5, Math.round(selectedRating / 20))))}
              </div>
            </div>

            <span className="mt-0.5 bg-[linear-gradient(95deg,#fff0b5_0%,#ffbf61_50%,#ff2a16_100%)] bg-clip-text text-2xl font-black leading-none text-transparent drop-shadow-[0_0_14px_rgba(255,106,52,0.45)] md:text-lg">
              {displayScore}
            </span>
          </div>

          <p className="mt-1.5 text-xs font-medium text-orange-200/85">
            <button
              type="button"
              className="rounded-full transition hover:text-orange-100"
              data-prevent-modal="true"
              onClick={(event) => {
                event.stopPropagation();
                setIsRatingsSheetOpen(true);
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {new Intl.NumberFormat("en-US").format(displayVotes)} rates
            </button>
          </p>

          {ratingMessage ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200/80">
              {ratingMessage}
            </p>
          ) : null}

          {isSliderVisible ? (
            <div
              className="absolute inset-x-0 bottom-0 z-20 rounded-b-[20px] border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,6,7,0.94),rgba(10,6,7,0.985))] px-5 py-4 shadow-[0_-16px_32px_rgba(0,0,0,0.35)]"
              data-prevent-modal="true"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <RatingSlider
                title={post.title}
                value={selectedRating}
                onChange={(value) => setSelectedRating(value)}
                onClose={() => setIsSliderVisible(false)}
                onConfirm={submitRating}
                confirmLabel={isSavingRating ? "Saving..." : "Confirm"}
                confirmDisabled={isSavingRating}
              />
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-orange-300/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200/75 transition hover:border-orange-300/30 hover:bg-white/10 hover:text-orange-100"
              data-prevent-modal="true"
              onClick={(event) => {
                event.stopPropagation();
                setIsSliderVisible(true);
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full rating-gradient" />
              Slide 0-100
            </button>
          )}

        </div>
      </article>

      <PostModal
        key={`${post.id}-${isOpen ? "open" : "closed"}`}
        post={post}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      <PostRatingsSheet
        postId={post.id}
        title={post.title}
        isOpen={isRatingsSheetOpen}
        onClose={() => setIsRatingsSheetOpen(false)}
      />
    </>
  );
}

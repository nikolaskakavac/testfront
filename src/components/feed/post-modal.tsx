"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { Post } from "@/types";

type PostModalProps = {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
};

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [loved, setLoved] = useState(Boolean(post.isFavorited));
  const [favoritesCount, setFavoritesCount] = useState<number>(post.favorites ?? 0);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);

  const images = useMemo(() => {
    if (post.images?.length) {
      return post.images;
    }
    return [post.imageUrl];
  }, [post.imageUrl, post.images]);

  useEffect(() => {
    setLoved(Boolean(post.isFavorited));
    setFavoritesCount(post.favorites ?? 0);
    setFavoriteMessage(null);
  }, [post.favorites, post.id, post.isFavorited]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const hasMultiple = images.length > 1;
  const subject = post.title.slice(0, 60);

  const toggleFavorite = async () => {
    if (isSavingFavorite) {
      return;
    }

    setIsSavingFavorite(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/favorite`, {
        method: loved ? "DELETE" : "POST",
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        favorites?: number;
        favorited?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.message || "Favorite request failed.");
      }

      setLoved(Boolean(data.favorited));
      setFavoritesCount(typeof data.favorites === "number" ? data.favorites : favoritesCount);
      setFavoriteMessage(data.favorited ? "Saved to favorites" : "Removed from favorites");
    } catch {
      setFavoriteMessage("Favorites trenutno ne rade. Restartuj backend.");
      return;
    } finally {
      setIsSavingFavorite(false);
      window.setTimeout(() => setFavoriteMessage(null), 2400);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative h-[92vw] w-[92vw] max-h-[760px] max-w-[760px] overflow-hidden rounded-3xl border border-white/18 bg-black shadow-[0_24px_68px_rgba(0,0,0,0.55)] md:h-[min(88vh,760px)] md:w-[min(92vw,760px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={images[currentImage]}
          alt={post.title}
          fill
          sizes="(max-width: 900px) 92vw, 760px"
          className="object-cover"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/72 via-black/35 to-transparent" />

        <button
          type="button"
          aria-label="Report post"
          className="absolute left-4 top-4 rounded-2xl bg-black/35 p-2.5 text-white/65 ring-1 ring-white/15 backdrop-blur-sm transition duration-200 hover:scale-[1.03] hover:text-red-500"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M6 21V4.8c0-1 1.1-1.6 1.9-1l7.7 5.1c.7.5.7 1.6 0 2.1L7.9 16c-.8.5-1.9 0-1.9-1Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Close post"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-2xl bg-black/35 p-2.5 text-white/65 ring-1 ring-white/15 backdrop-blur-sm transition duration-200 hover:scale-[1.03] hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-2xl bg-black/35 p-2.5 text-white/70 ring-1 ring-white/15 backdrop-blur-sm transition duration-200 hover:scale-[1.03] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl bg-black/35 p-2.5 text-white/70 ring-1 ring-white/15 backdrop-blur-sm transition duration-200 hover:scale-[1.03] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}

        <button
          type="button"
          aria-label="Love post"
          onClick={toggleFavorite}
          disabled={isSavingFavorite}
          className={`absolute bottom-4 right-4 rounded-2xl bg-black/35 p-2.5 ring-1 ring-white/15 backdrop-blur-sm transition duration-200 ${
            loved ? "text-red-500" : "text-white/65 hover:scale-[1.03] hover:text-red-500"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M20.8 6.6c-1.1-2-3.6-3.1-5.8-2.1-1.1.5-2 1.4-2.5 2.3-.5-.9-1.4-1.8-2.5-2.3-2.2-1-4.7.1-5.8 2.1-1.2 2.1-.6 4.8 1.2 6.3L12 21l6.6-8.1c1.8-1.5 2.4-4.2 1.2-6.3z" />
          </svg>
        </button>

        <div className="absolute right-4 top-16 rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
          {favoritesCount} favorites
        </div>

        {favoriteMessage ? (
          <div className="absolute left-4 top-16 max-w-[60%] rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
            {favoriteMessage}
          </div>
        ) : null}

        <div className="absolute bottom-4 left-4 max-w-[80%] text-white">
          <p className="line-clamp-2 max-w-[30ch] break-words text-xl font-bold leading-6 text-white">{subject}</p>
          <p className="mt-1 text-base font-semibold text-white/85" style={{ fontFamily: "rustic_roadway, cursive" }}>
            @{post.user.username}
          </p>
        </div>
      </div>
    </div>
  );
}

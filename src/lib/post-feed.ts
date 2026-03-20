import { getAvatarUrl } from "@/lib/user-avatar";
import { getPostImageUrl } from "@/lib/post-image";
import type { Post } from "@/types";

export type BackendPost = {
  id: string;
  title?: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  category?: string;
  tags?: string[];
  hashtags?: string[];
  score?: number;
  votes?: number;
  favorites?: number;
  favorites_count?: number;
  isFavorited?: boolean;
  is_favorited?: boolean;
  ratings_count?: number;
  userRating?: number;
  user_rating?: number;
  createdAt?: string;
  created_at?: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
    avatar_url?: string;
  };
};

export function mapBackendPosts(posts: BackendPost[]): Post[] {
  return posts.map((post) => {
    const rawImages = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
    const normalizedImages = rawImages
      .map((image) => getPostImageUrl(image) ?? "")
      .filter(Boolean);

    const fallbackImage =
      normalizedImages[0] ||
      getPostImageUrl(post.imageUrl) ||
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

    const avatarPath = post.user?.avatarUrl ?? post.user?.avatar_url ?? null;

    return {
      id: post.id,
      title: post.title || "Untitled post",
      imageUrl: fallbackImage,
      images: normalizedImages.length ? normalizedImages : [fallbackImage],
      description: post.description || "",
      category: post.category || "General",
      tags: Array.isArray(post.tags)
        ? post.tags
        : Array.isArray(post.hashtags)
          ? post.hashtags
          : [],
      score: Number(post.score ?? 0),
      votes: Number(post.votes ?? post.ratings_count ?? 0),
      favorites: Number(post.favorites ?? post.favorites_count ?? 0),
      isFavorited: Boolean(post.isFavorited ?? post.is_favorited ?? false),
      userRating:
        typeof post.userRating === "number"
          ? post.userRating
          : typeof post.user_rating === "number"
            ? post.user_rating
            : undefined,
      user: {
        id: post.user?.id || "unknown",
        username: post.user?.username || "anonymous",
        avatarUrl: getAvatarUrl(avatarPath) ?? undefined,
      },
      createdAt: post.createdAt ?? post.created_at,
    };
  });
}

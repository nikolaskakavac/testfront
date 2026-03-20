import Link from "next/link";
import { cookies } from "next/headers";

import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import Topbar from "@/components/layout/topbar";
import FavoritesFeed from "@/components/feed/favorites-feed";
import { mapBackendPosts, type BackendPost } from "@/lib/post-feed";
import { getAuthSession } from "@/lib/auth-session";
import type { Post } from "@/types";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

async function loadFavoritePosts(): Promise<Post[]> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken || !csrfToken) {
    return [];
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/favorites`, {
      headers: {
        Cookie: [
          `session_token=${sessionToken}`,
          `csrf_token=${csrfToken}`,
          refreshToken ? `refresh_token=${refreshToken}` : "",
        ]
          .filter(Boolean)
          .join("; "),
        "X-CSRF-Token": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const posts = Array.isArray(data?.posts) ? data.posts : [];

    return mapBackendPosts(posts as BackendPost[]);
  } catch {
    return [];
  }
}

export default async function LikesPage() {
  const session = await getAuthSession();
  const favoritePosts = session.authenticated ? await loadFavoritePosts() : [];

  if (!session.authenticated) {
    return (
      <main className="min-h-screen text-[color:var(--text)]">
        <Topbar />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
              Favorites
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">
              Log in to see
              <span className="block brand-text-gradient">your saved posts.</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Favorited posts will show up here so you can revisit the things worth keeping.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/login" className="motion-button button-primary">
                Log in
              </Link>
              <Link href="/" className="motion-button button-secondary">
                Back to feed
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[color:var(--text)]">
      <Topbar />
      <SideNav />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:ml-56">
        <section className="space-y-6">
          <div className="rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">Saved list</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-4xl">
              Your favorite drops
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              Everything you heart stays here. Use it like your personal shortlist of posts worth revisiting.
            </p>
          </div>

          {favoritePosts.length ? (
            <FavoritesFeed initialPosts={favoritePosts} />
          ) : (
            <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">No favorites yet</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Tap the heart on a post and it will appear here.
              </p>
              <Link href="/" className="motion-button button-secondary mt-6 inline-flex">
                Explore posts
              </Link>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}

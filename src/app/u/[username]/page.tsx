import Link from "next/link";
import { cookies } from "next/headers";

import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import Topbar from "@/components/layout/topbar";
import ProfilePostsGrid from "@/components/profile/profile-posts-grid";
import FollowButton from "@/components/profile/follow-button";
import Avatar from "@/components/user/avatar";
import { mapBackendPosts, type BackendPost } from "@/lib/post-feed";
import { getAuthSession } from "@/lib/auth-session";
import { getAvatarUrl } from "@/lib/user-avatar";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

async function getCookieHeader() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  return [
    sessionToken ? `session_token=${sessionToken}` : "",
    csrfToken ? `csrf_token=${csrfToken}` : "",
    refreshToken ? `refresh_token=${refreshToken}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

async function loadUserProfile(username: string) {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/users/by-username/${encodeURIComponent(username)}`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

async function loadUserPosts(username: string) {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/posts?limit=100`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    return mapBackendPosts(posts as BackendPost[]).filter((post) => post.user.username === username);
  } catch {
    return [];
  }
}

export default async function PublicUserPage({ params }: PageProps) {
  const { username } = await params;
  const session = await getAuthSession();
  const profile = await loadUserProfile(username);
  const posts = await loadUserPosts(username);

  if (!profile) {
    return (
      <main className="min-h-screen text-[color:var(--text)]">
        <Topbar />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">User</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">
              Profile not found
            </h1>
            <Link href="/" className="motion-button button-secondary mt-8 inline-flex">
              Back to feed
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const avatarUrl = getAvatarUrl(profile.img_url);
  const ratingsCount = posts.reduce((sum, post) => sum + (post.userRating ? 1 : 0), 0);

  return (
    <main className="min-h-screen text-[color:var(--text)]">
      <Topbar />
      <SideNav />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:ml-56">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <Avatar username={profile.username} avatarUrl={avatarUrl} size={96} priority />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
                    Public profile
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-4xl">
                    @{profile.username}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                    Taste dashboard, public drops, and everything this user decided to put up for rating.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                {[
                  { label: "Posts", value: String(profile.posts ?? posts.length) },
                  { label: "Ratings", value: String(ratingsCount) },
                  { label: "Followers", value: String(profile.followers ?? 0) },
                  { label: "Following", value: String(profile.followings ?? 0) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-4 text-center shadow-[var(--shadow-card)]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <FollowButton
                userId={profile.id}
                initialFollowing={Boolean(profile.following)}
                initialFollowers={Number(profile.followers ?? 0)}
                isOwnProfile={Boolean(profile.isSelf || session.id === profile.id)}
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--muted)]">Recent posts</p>
                <p className="mt-1 text-2xl font-bold text-[color:var(--text-strong)]">@{profile.username}&apos;s drops</p>
              </div>
              {profile.isSelf ? (
                <Link href="/profile" className="motion-button button-secondary">
                  Open your profile
                </Link>
              ) : null}
            </div>

            <div className="mt-5">
              {posts.length ? (
                <ProfilePostsGrid
                  posts={posts.map((post) => ({
                    id: post.id,
                    title: post.title,
                    category: post.category,
                    score: post.score,
                    imageUrl: post.imageUrl,
                  }))}
                  canDelete={false}
                />
              ) : (
                <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-5 py-10 text-center text-sm text-[color:var(--muted)]">
                  Ovaj user jos nema javnih objava.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}

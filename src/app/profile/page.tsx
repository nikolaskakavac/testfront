import Link from "next/link";
import { cookies } from "next/headers";

import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import Topbar from "@/components/layout/topbar";
import { getAuthSession } from "@/lib/auth-session";
import AvatarUploadForm from "@/components/profile/avatar-upload-form";
import EditProfileForm from "@/components/profile/edit-profile-form";
import ProfilePostsGrid from "@/components/profile/profile-posts-grid";
import Avatar from "@/components/user/avatar";
import { getAvatarUrl } from "@/lib/user-avatar";
import { mapBackendPosts, type BackendPost } from "@/lib/post-feed";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

async function loadProfilePosts(username: string) {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/posts?limit=100`, {
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

type FollowListUser = {
  id: string;
  username: string;
  avatarUrl?: string;
};

type FollowListPayloadUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
};

async function getBackendCookieHeader() {
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

async function loadFollowList(userId: string, type: "followers" | "following"): Promise<FollowListUser[]> {
  try {
    const cookieHeader = await getBackendCookieHeader();
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/users/${userId}/${type}`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const users = (Array.isArray(data?.users) ? data.users : []) as FollowListPayloadUser[];

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      avatarUrl: getAvatarUrl(user.avatarUrl ?? user.avatar_url) ?? undefined,
    }));
  } catch {
    return [];
  }
}

async function loadFavoriteCount(): Promise<number> {
  try {
    const cookieHeader = await getBackendCookieHeader();
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/favorites`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    return posts.length;
  } catch {
    return 0;
  }
}

export default async function ProfilePage() {
  const session = await getAuthSession();
  const isAuthenticated = session.authenticated;
  const username = session.username || "rater_user";
  const email = session.email || "member@rater.app";
  const profileHandle = `@${username}`;
  const avatarUrl = isAuthenticated ? getAvatarUrl(session.imgUrl) : null;
  const profilePosts = isAuthenticated ? await loadProfilePosts(username) : [];
  const followers = isAuthenticated && session.id ? await loadFollowList(session.id, "followers") : [];
  const following = isAuthenticated && session.id ? await loadFollowList(session.id, "following") : [];
  const favoritesCount = isAuthenticated ? await loadFavoriteCount() : 0;
  const ratingsCount = profilePosts.reduce((sum, post) => sum + (post.userRating ? 1 : 0), 0);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen text-[color:var(--text)]">
        <Topbar />
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
              Members only
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">
              Login to view
              <span className="block brand-text-gradient">your profile hub.</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Save your favorite posts, track your scores, and manage your rateR identity from one place.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/login" className="motion-button button-primary">
                Log in
              </Link>
              <Link href="/signup" className="motion-button button-secondary">
                Create account
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

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:ml-56 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="grid gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar username={username} avatarUrl={avatarUrl} size={96} priority />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
                      Your profile
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-4xl">
                      {profileHandle}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                      Logged in as {email}. This page is your taste dashboard, profile hub, and shortcut to everything you save or post.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-stretch gap-3 xl:justify-end">
                  <div className="min-w-[120px] rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-4 text-center shadow-[var(--shadow-card)]">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Followers</p>
                    <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{session.followers}</p>
                  </div>
                  <div className="min-w-[120px] rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-4 text-center shadow-[var(--shadow-card)]">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Following</p>
                    <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">{session.followings}</p>
                  </div>
                  <EditProfileForm initialUsername={username} initialEmail={email} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-3">
                {[
                  { label: "Posts", value: String(profilePosts.length) },
                  { label: "Ratings", value: String(ratingsCount) },
                  { label: "Favorites", value: String(favoritesCount) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-4 text-center shadow-[var(--shadow-card)]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-[color:var(--text-strong)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--muted)]">Recent posts</p>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--text-strong)]">Your latest drops</p>
                </div>
                <Link href="/#create-post" className="motion-button button-secondary">
                  Create post
                </Link>
              </div>

              <div className="mt-5">
                {profilePosts.length ? (
                  <ProfilePostsGrid
                    posts={profilePosts.map((post) => ({
                      id: post.id,
                      title: post.title,
                      category: post.category,
                      score: post.score,
                      imageUrl: post.imageUrl,
                    }))}
                  />
                ) : (
                  <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-5 py-10 text-center text-sm text-[color:var(--muted)]">
                    Jos nemas objava. Napravi prvi post i pojavi se ovde.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Profile photo</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Update your avatar here. If you skip it, the default user icon stays in place.
              </p>
              <div className="mt-5">
                <AvatarUploadForm />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--muted)]">Network</p>
                <p className="mt-1 text-2xl font-bold text-[color:var(--text-strong)]">Followers & following</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                  The people who follow your taste, and the people whose drops you keep an eye on.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div className="rounded-[28px] border border-[color:var(--line)] bg-[var(--subtle-bg)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300/90">Followers</p>
                <div className="mt-4 space-y-3">
                  {followers.length ? (
                    followers.slice(0, 8).map((user) => (
                      <Link
                        key={user.id}
                        href={`/u/${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3 transition hover:border-[color:var(--line-strong)] hover:bg-[var(--subtle-bg-2)]"
                      >
                        <Avatar username={user.username} avatarUrl={user.avatarUrl} size={42} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">
                            @{user.username}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                            Follows you
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-6 text-sm text-[color:var(--muted)]">
                      No followers yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[color:var(--line)] bg-[var(--subtle-bg)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300/90">Following</p>
                <div className="mt-4 space-y-3">
                  {following.length ? (
                    following.slice(0, 8).map((user) => (
                      <Link
                        key={user.id}
                        href={`/u/${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-3 transition hover:border-[color:var(--line-strong)] hover:bg-[var(--subtle-bg-2)]"
                      >
                        <Avatar username={user.username} avatarUrl={user.avatarUrl} size={42} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--text-strong)]">
                            @{user.username}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                            You follow
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] px-4 py-6 text-sm text-[color:var(--muted)]">
                      Not following anyone yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Profile actions</p>
              <div className="mt-4 space-y-3">
                <Link href="/likes" className="motion-button button-secondary w-full justify-center">
                  View favorites
                </Link>
                <Link href="/" className="motion-button button-quiet w-full justify-center">
                  Back to feed
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <BottomNav />
    </main>
  );
}

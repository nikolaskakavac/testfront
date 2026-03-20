import Image from "next/image";
import Link from "next/link";

import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import Topbar from "@/components/layout/topbar";
import { getAuthSession } from "@/lib/auth-session";
import AvatarUploadForm from "@/components/profile/avatar-upload-form";
import Avatar from "@/components/user/avatar";
import { getAvatarUrl } from "@/lib/user-avatar";

const profilePosts = [
  {
    id: "p1",
    title: "Nike Dunk Low Panda",
    category: "Sneakers",
    score: 94,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "p2",
    title: "Minimal Gaming Setup",
    category: "Setups",
    score: 83,
    imageUrl:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "p3",
    title: "Neon Street Portrait",
    category: "Photography",
    score: 88,
    imageUrl:
      "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80",
  },
];

const favoriteCategories = ["Sneakers", "Setups", "Streetwear", "Photography"];

export default async function ProfilePage() {
  const session = await getAuthSession();
  const isAuthenticated = session.authenticated;
  const username = session.username || "rater_user";
  const email = session.email || "member@rater.app";
  const profileHandle = `@${username}`;
  const avatarUrl = isAuthenticated ? await getAvatarUrl(username) : null;

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
          <div className="overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                {[
                  { label: "Posts", value: "12" },
                  { label: "Ratings", value: "418" },
                  { label: "Favorites", value: "63" },
                  { label: "Followers", value: "231" },
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
                <button className="motion-button button-secondary">Create post</button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {profilePosts.map((post) => (
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

            <div className="space-y-6">
              <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm font-semibold text-[color:var(--muted)]">Identity</p>
                <div className="mt-4 space-y-4 text-sm text-[color:var(--muted)]">
                  <AvatarUploadForm />
                  <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Role</p>
                    <p className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">Curator / Rater</p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Best at</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {favoriteCategories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-[color:var(--line)] bg-[var(--subtle-bg-2)] px-3 py-2 text-xs text-[color:var(--text-strong)]"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm font-semibold text-[color:var(--muted)]">Account energy</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Profile completion", value: "86%" },
                    { label: "Weekly streak", value: "7 days" },
                    { label: "Saved favorites", value: "63 posts" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4 text-sm"
                    >
                      <span className="text-[color:var(--muted)]">{item.label}</span>
                      <span className="font-semibold text-[color:var(--text-strong)]">{item.value}</span>
                    </div>
                  ))}
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
                <button className="motion-button button-primary w-full justify-center">Edit profile</button>
                <Link href="/likes" className="motion-button button-secondary w-full justify-center">
                  View favorites
                </Link>
                <Link href="/" className="motion-button button-quiet w-full justify-center">
                  Back to feed
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Why this page matters</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                rateR profiles should feel like a blend of creator page and taste dashboard, not a generic social bio.
              </p>
              <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/90">Signed in as</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">{profileHandle}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <BottomNav />
    </main>
  );
}

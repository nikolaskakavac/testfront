import Image from "next/image";
import { cookies } from "next/headers";

import Topbar from "@/components/layout/topbar";
import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import PostCard from "@/components/feed/post-card";
import CreatePostPanel from "@/components/feed/create-post-panel";
import { mapBackendPosts, type BackendPost } from "@/lib/post-feed";
import type { Post } from "@/types";

const MAX_POST_TITLE_LENGTH = 60;

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

const BACKEND_POSTS_PATH = process.env.BACKEND_POSTS_PATH || "/web/posts";

const rawMockPosts: Post[] = [
  {
    id: "1",
    title: "Nike Dunk Low Panda Retro Collector Edition Streetwear Rated",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600185365523-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "Sneakers",
    score: 94,
    votes: 12482,
    user: { id: "u1", username: "LisaWanderlust" },
    description: "Classic everyday pair that keeps dividing sneakerheads between timeless and overhyped.",
    comments: [
      { id: "c1", user: "wildadventurer", text: "This colorway still wins." },
      { id: "c2", user: "ellirock", text: "Instant 9/10 from me." },
    ],
    tags: ["sneakers", "streetwear"],
  },
  {
    id: "2",
    title: "Minimal Gaming Setup",
    imageUrl:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "Setups",
    score: 83,
    votes: 8521,
    user: { id: "u2", username: "MateoDrives" },
    description: "Compact desk, warm lighting, and a clean dual-monitor layout with zero clutter.",
    comments: [
      { id: "c3", user: "innovince", text: "Lighting is super clean." },
      { id: "c4", user: "alex_15", text: "Desk cable management is perfect." },
    ],
    tags: ["setup", "gaming"],
  },
  {
    id: "3",
    title: "Magical morning in the woods",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "Nature",
    score: 91,
    votes: 1079,
    user: { id: "u3", username: "NatureExplorer" },
    description: "Magical morning in the woods.",
    comments: [
      { id: "c5", user: "mila", text: "That light beam is unreal." },
      { id: "c6", user: "nick", text: "Wallpaper material." },
    ],
    tags: ["nature", "photography"],
  },
  {
    id: "4",
    title: "Neon Street Portrait",
    imageUrl:
      "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "Photography",
    score: 88,
    votes: 6450,
    user: { id: "u4", username: "NeonMoods" },
    description: "Late night walk vibes in downtown.",
    comments: [
      { id: "c7", user: "emilycreates", text: "This palette is crazy good." },
      { id: "c8", user: "wildadventurer", text: "Feels like a movie still." },
    ],
    tags: ["night", "neon"],
  },
];

const mockPosts = rawMockPosts.map((post) => ({
  ...post,
  title:
    post.title.length > MAX_POST_TITLE_LENGTH
      ? `${post.title.slice(0, MAX_POST_TITLE_LENGTH - 3)}...`
      : post.title,
}));

function normalizePosts(posts: Post[]): Post[] {
  return posts.map((post) => ({
    ...post,
    title: (() => {
      const title = post.title || "Untitled post";
      return title.length > MAX_POST_TITLE_LENGTH
        ? `${title.slice(0, MAX_POST_TITLE_LENGTH - 3)}...`
        : title;
    })(),
  }));
}
async function loadPosts(): Promise<Post[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const csrfToken = cookieStore.get("csrf_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    const response = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}`, {
      cache: "no-store",
      headers: {
        Cookie: [
          sessionToken ? `session_token=${sessionToken}` : "",
          csrfToken ? `csrf_token=${csrfToken}` : "",
          refreshToken ? `refresh_token=${refreshToken}` : "",
        ]
          .filter(Boolean)
          .join("; "),
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];

    if (!posts.length) {
      return mockPosts;
    }

    return normalizePosts(mapBackendPosts(posts as BackendPost[]));
  } catch {
    return mockPosts;
  }
}

const leaderboard = [
  { username: "EllieRock", points: "7,895" },
  { username: "Alex_15", points: "7,241" },
  { username: "WildAdventurer", points: "7,002" },
  { username: "InnoVince", points: "6,788" },
  { username: "EmilyCreates", points: "6,577" },
];

export default async function HomePage() {
  const posts = await loadPosts();

  return (
    <main className="min-h-screen bg-black text-[color:var(--text)]">
      <Topbar />

      <SideNav />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:ml-56 md:grid-cols-[minmax(0,1fr)_320px]">

          <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(255,210,112,0.9),rgba(255,51,22,0.9))] p-px">
            <section className="space-y-4 rounded-3xl bg-black p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[color:var(--text-strong)]">Home</h2>
              </div>

              <CreatePostPanel />

              <div className="grid grid-cols-1 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          </div>

        <aside className="hidden md:block">
          <div className="sticky top-6 w-72 space-y-4">
            <div className="rounded-3xl border border-[color:var(--line)] bg-black p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Leaderboard</p>
              <div className="mt-3 space-y-2">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.username}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] px-3 py-3 transition ${
                      idx === 0
                        ? "bg-[linear-gradient(135deg,rgba(255,229,150,0.2),rgba(255,148,61,0.2),rgba(255,45,21,0.18))] shadow-[0_10px_34px_rgba(178,72,31,0.22)]"
                        : "bg-black/70 hover:-translate-y-0.5 hover:bg-black/85"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text-strong)]">#{idx + 1} @{item.username}</p>
                    </div>
                    <p className={`text-sm font-bold ${idx === 0 ? "text-amber-100" : "text-orange-300"}`}>{item.points}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--line)] bg-black p-4">
              <p className="text-sm font-semibold text-[color:var(--muted)]">Trending</p>
              <div className="mt-3 grid gap-3">
                {posts.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-24 overflow-hidden rounded-lg bg-black">
                      <Image src={t.imageUrl} alt={t.title} fill className="object-cover" sizes="(max-width: 1023px) 100vw, 20vw" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{new Intl.NumberFormat("en-US").format(t.votes)} votes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <BottomNav />
    </main>
  );
}





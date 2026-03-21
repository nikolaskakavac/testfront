import Link from "next/link";
import { cookies } from "next/headers";

import BottomNav from "@/components/layout/bottom-nav";
import SideNav from "@/components/layout/side-nav";
import Topbar from "@/components/layout/topbar";
import Avatar from "@/components/user/avatar";
import { getAuthSession } from "@/lib/auth-session";
import { getAvatarUrl } from "@/lib/user-avatar";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

type NotificationItem = {
  id: string;
  type: string;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
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

async function loadNotifications(): Promise<NotificationItem[]> {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(`${BACKEND_API_BASE_URL}/web/notifications`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { notifications?: NotificationItem[] };
    return Array.isArray(data.notifications) ? data.notifications : [];
  } catch {
    return [];
  }
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const session = await getAuthSession();
  const isAuthenticated = session.authenticated;
  const notifications = isAuthenticated ? await loadNotifications() : [];

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
              Log in to open
              <span className="block brand-text-gradient">your notifications.</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Follow alerts and future activity updates will show up here.
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

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-6 md:ml-56">
        <section className="space-y-6">
          <div className="rounded-[36px] border border-[color:var(--line)] bg-[var(--hero-bg)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90">
              Notifications
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-4xl">
              Keep up with your
              <span className="block brand-text-gradient">growing network.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              For now, this is where follow activity lands. If someone unfollows you, that follow notification disappears automatically.
            </p>
          </div>

          <div className="rounded-[32px] border border-[color:var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
            {notifications.length ? (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const actorAvatarUrl = getAvatarUrl(notification.actor.avatarUrl);

                  return (
                    <Link
                      key={notification.id}
                      href={`/u/${encodeURIComponent(notification.actor.username)}`}
                      className="flex items-center gap-4 rounded-[28px] border border-[color:var(--line)] bg-[var(--subtle-bg)] px-4 py-4 transition hover:border-[color:var(--line-strong)] hover:bg-[var(--subtle-bg-2)]"
                    >
                      <Avatar
                        username={notification.actor.username}
                        avatarUrl={actorAvatarUrl}
                        size={52}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[color:var(--text-strong)] sm:text-base">
                          <span className="text-orange-200">@{notification.actor.username}</span> started following you
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                          {notification.type} · {formatNotificationDate(notification.createdAt)}
                        </p>
                      </div>
                      <span className="hidden rounded-full border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--text-strong)] sm:inline-flex">
                        View profile
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-[color:var(--line)] bg-[var(--subtle-bg)] px-5 py-10 text-center">
                <p className="text-lg font-semibold text-[color:var(--text-strong)]">No notifications yet</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  When someone follows you, it will show up here with a direct link to their profile.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}

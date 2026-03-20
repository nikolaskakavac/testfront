import Link from "next/link";

import LogoutButton from "@/components/auth/logout-button";
import { getAuthSession } from "@/lib/auth-session";
import HoverSearch from "./hover-search";
import ThemeToggle from "./theme-toggle";

export default async function Topbar() {
  const session = await getAuthSession();
  const isAuthenticated = session.authenticated;
  const profileInitial = session.username?.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="motion-enter sticky top-0 z-30 border-b border-white/10 bg-[rgba(16,8,10,0.62)] backdrop-blur-[12px]">
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-[linear-gradient(90deg,transparent,rgba(255,210,112,0.55),rgba(255,51,22,0.55),transparent)]" />

      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 md:px-5">
        <Link href="/" className="group flex items-center gap-2.5 transition duration-300 hover:brightness-110">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(145deg,rgba(255,224,133,0.24),rgba(255,140,58,0.2),rgba(255,44,18,0.2))] ring-1 ring-white/15 transition duration-300 group-hover:shadow-[0_0_24px_rgba(255,127,56,0.32)]">
            <span className="text-base font-black text-white">R</span>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.28),transparent_58%)]" />
          </div>
          <div className="leading-none">
            <p className="bg-[linear-gradient(92deg,#ffe7a6_0%,#ffcb66_35%,#ff8d3e_70%,#ff2f16_100%)] bg-clip-text text-base font-extrabold tracking-[0.14em] text-transparent">
              rateR
            </p>
          </div>
        </Link>

        <div className="flex min-w-0 items-center justify-center px-2">
          <div className="w-full max-w-xl">
            <HoverSearch />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="hidden md:block">
                <LogoutButton />
              </div>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200/40 bg-[linear-gradient(135deg,rgba(255,234,166,0.2),rgba(255,151,62,0.2),rgba(255,47,21,0.22))] text-amber-50/90 transition duration-300 hover:scale-[1.03] hover:brightness-110"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
                </svg>
              </Link>
              <Link
                href="/likes"
                aria-label="Favorites"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200/40 bg-[linear-gradient(135deg,rgba(255,234,166,0.2),rgba(255,151,62,0.2),rgba(255,47,21,0.22))] text-amber-50/90 transition duration-300 hover:scale-[1.03] hover:text-orange-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 20.2 4.5 13.6a4.9 4.9 0 0 1 6.9-6.9L12 7.3l.6-.6a4.9 4.9 0 0 1 6.9 6.9L12 20.2Z" />
                </svg>
              </Link>
              <Link
                href="/profile"
                aria-label="Profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200/45 bg-[linear-gradient(135deg,rgba(255,236,170,0.28),rgba(255,157,66,0.28),rgba(255,42,18,0.26))] text-sm font-bold text-white transition duration-300 hover:scale-[1.03] hover:brightness-110"
              >
                {profileInitial}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-1 text-sm text-white/55 transition duration-300 hover:text-white/80">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[linear-gradient(95deg,#ffe7a8_0%,#ffbe61_34%,#ff7a36_68%,#ff2f16_100%)] px-5 py-2.5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_32px_rgba(165,65,28,0.38)] transition duration-300 hover:scale-[1.04] hover:brightness-110"
              >
                Get Started -&gt;
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

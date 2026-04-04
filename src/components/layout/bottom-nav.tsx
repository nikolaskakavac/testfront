"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  accent?: boolean;
  activeWhen?: string[];
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      <path
        d="M12 20.2 4.5 13.6a4.9 4.9 0 0 1 6.9-6.9L12 7.3l.6-.6a4.9 4.9 0 0 1 6.9 6.9L12 20.2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3 4.2-4.5 7-4.5S17.2 16 19 19" strokeLinecap="round" />
    </svg>
  );
}

const items: NavItem[] = [
  { label: "Home", icon: <HomeIcon />, href: "/", activeWhen: ["/"] },
  { label: "Search", icon: <SearchIcon />, href: "/" },
  { label: "Create", icon: <PlusIcon />, href: "/?compose=1#create-post", accent: true, activeWhen: ["/"] },
  { label: "Favorites", icon: <HeartIcon />, href: "/likes" },
  { label: "Profile", icon: <UserIcon />, href: "/profile", activeWhen: ["/profile"] },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--line)] bg-[var(--header-bg)] px-3 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-2 rounded-[22px] border border-[color:var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card)]">
        {items.map((item) => {
          const isActive = item.activeWhen?.includes(pathname) ?? false;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                item.accent
                  ? "brand-gradient text-[color:var(--button-text)] shadow-[0_10px_25px_rgba(164,63,26,0.3)]"
                  : isActive
                    ? "bg-[var(--subtle-bg-2)] text-[color:var(--text-strong)]"
                    : "text-[color:var(--muted)] hover:bg-[var(--subtle-bg-2)] hover:text-[color:var(--text-strong)]"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

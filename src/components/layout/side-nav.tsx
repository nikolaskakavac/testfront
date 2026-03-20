"use client";

import Link from "next/link";

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center">{children}</span>;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="m14.8 9.2-1.8 4.2-4.2 1.8 1.8-4.2 4.2-1.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M20.8 6.6c-1.1-2-3.6-3.1-5.8-2.1-1.1.5-2 1.4-2.5 2.3-.5-.9-1.4-1.8-2.5-2.3-2.2-1-4.7.1-5.8 2.1-1.2 2.1-.6 4.8 1.2 6.3L12 21l6.6-8.1c1.8-1.5 2.4-4.2 1.2-6.3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SideNav() {
  const items = [
    { key: 'home', label: 'Home', icon: <HomeIcon />, active: true },
    { key: 'explore', label: 'Explore', icon: <SearchIcon /> },
    { key: 'categories', label: 'Categories', icon: <CategoriesIcon /> },
    { key: 'favorites', label: 'Favorites', icon: <HeartIcon /> },
    { key: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  ];

  return (
    <aside className="hidden md:block">
      <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 z-20">
        <div className="h-full w-56">
          <div
            className="relative h-full w-full border-r border-[color:var(--line)] bg-black shadow-[inset_0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >

            <nav className="relative z-10 flex h-full flex-col justify-between">
              <div className="pt-2">
                <div className="flex flex-col items-stretch gap-2 px-1 pt-0">
                  {items.map((it) => {
                    const linkClass = [
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition duration-300',
                      it.active
                        ? 'bg-[linear-gradient(135deg,rgba(255,229,150,0.24),rgba(255,148,61,0.24),rgba(255,44,21,0.22))] text-[color:var(--text-strong)] shadow-[0_10px_28px_rgba(177,74,32,0.25)]'
                        : 'text-[color:var(--muted)] hover:translate-x-1 hover:bg-[rgba(255,255,255,0.08)] hover:text-[color:var(--text-strong)]',
                    ].join(' ');
                    const iconClass = it.active ? 'rounded-lg bg-[rgba(255,255,255,0.14)] p-2 text-[color:var(--button-text)]' : 'text-[color:var(--muted)]';
                    return (
                      <Link key={it.key} href="#" className={linkClass}>
                        <span className={iconClass}>
                          <Icon>{it.icon}</Icon>
                        </span>
                        <span className="flex-1">{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="px-1 pb-6">
                <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[color:var(--muted)] hover:bg-[rgba(255,255,255,0.02)]">
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M5 12h14M5 6h14M5 18h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span>More</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}

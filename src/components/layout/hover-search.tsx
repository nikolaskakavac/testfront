"use client";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export default function HoverSearch() {
  return (
    <div className="group flex w-full items-center justify-center">
      <div className="flex w-full max-w-[34rem] items-center rounded-full border border-[color:var(--line)] bg-[var(--surface-2)] pl-2 pr-4 shadow-[var(--shadow-card)] transition duration-300 hover:border-orange-300/60 hover:shadow-[0_0_0_1px_rgba(253,186,116,0.45),0_0_26px_rgba(255,97,52,0.2)] focus-within:border-orange-300/60 focus-within:shadow-[0_0_0_1px_rgba(253,186,116,0.5),0_0_30px_rgba(255,71,38,0.25)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[color:var(--text-strong)]">
          <SearchIcon />
        </div>
        <input
          type="search"
          placeholder="Search posts, users, categories..."
          className="ml-3 w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
        />
      </div>
    </div>
  );
}

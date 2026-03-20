import Image from "next/image";

type AvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  priority?: boolean;
};

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[52%] w-[52%]" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export default function Avatar({
  username,
  avatarUrl,
  size = 40,
  className = "",
  priority = false,
}: AvatarProps) {
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  if (avatarUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-[28%] border border-[color:var(--line-strong)] bg-[var(--surface-2)] text-white shadow-[var(--shadow-card)] ${className}`}
        style={dimensionStyle}
      >
        <Image
          src={avatarUrl}
          alt={`${username} avatar`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-[28%] border border-[color:var(--line-strong)] bg-[linear-gradient(145deg,rgba(255,224,133,0.16),rgba(255,140,58,0.14),rgba(255,44,18,0.14))] text-amber-50 shadow-[var(--shadow-card)] ${className}`}
      style={dimensionStyle}
      aria-label={`${username} avatar fallback`}
    >
      <UserIcon />
    </div>
  );
}

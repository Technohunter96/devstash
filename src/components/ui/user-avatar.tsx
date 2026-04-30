import Image from "next/image";

interface UserAvatarProps {
  name: string | null | undefined;
  image: string | null | undefined;
  size?: number;
  className?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserAvatar({ name, image, size = 32, className = "" }: UserAvatarProps) {
  const baseClass = `rounded-full bg-muted flex items-center justify-center text-xs font-semibold uppercase overflow-hidden shrink-0 ${className}`;
  const style = { width: size, height: size, minWidth: size, minHeight: size };

  if (image) {
    return (
      <div className={baseClass} style={style}>
        <Image
          src={image}
          alt={name ?? "User avatar"}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={baseClass} style={style}>
      {getInitials(name)}
    </div>
  );
}
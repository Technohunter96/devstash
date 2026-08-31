// Three stacked, fading rounded squares — a "stash" of items, distinct from the generic Code bracket icon
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="14" height="14" rx="4" fill="currentColor" opacity="0.3" />
      <rect x="5" y="5" width="14" height="14" rx="4" fill="currentColor" opacity="0.6" />
      <rect x="8" y="8" width="14" height="14" rx="4" fill="currentColor" />
    </svg>
  );
}

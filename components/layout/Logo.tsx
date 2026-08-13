import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" priority />
      <span className="text-h3 text-neutral-900">PawShop</span>
    </span>
  );
}

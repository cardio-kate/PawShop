import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

interface AdminPaginationProps {
  page: number;
  pageCount: number;
  basePath: string;
}

// Server Component, не client — admin-списки (в отличие от CatalogClient) не имеют клиентских
// фильтров, читать/писать текущую страницу можно прямо через `?page=` в URL и <Link>, без fetch
// на клиенте. Тот же визуальный язык (pagination-item/pagination-item-active, design.md §Pagination),
// что у CatalogClient — переиспользование, не второй независимый стиль под тот же смысл.
export function AdminPagination({ page, pageCount, basePath }: AdminPaginationProps) {
  if (pageCount <= 1) return null;

  function href(p: number) {
    return p === 1 ? basePath : `${basePath}?page=${p}`;
  }

  return (
    <nav aria-label="Pagination" className="gap-xs flex items-center justify-center pt-md">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label="Previous page"
          className={`duration-fast hover:text-paw flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      )}

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Go to page ${p}`}
          className={`text-label-md duration-fast flex h-9 w-9 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} ${
            p === page ? 'bg-paw text-surface' : 'hover:text-paw text-neutral-700'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < pageCount ? (
        <Link
          href={href(page + 1)}
          aria-label="Next page"
          className={`duration-fast hover:text-paw flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

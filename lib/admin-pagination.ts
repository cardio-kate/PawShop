import { redirect } from 'next/navigation';

// Общая логика чтения `?page=` для обеих admin-таблиц (orders/products) — до этого была
// продублирована 1:1 в обоих page.tsx и содержала баг: `Number(pageParam) || 1` пропускала дробные
// строки (`?page=1.5` → нецелый offset в Postgres) без клампа. Number.parseInt усекает дробную
// часть вместо падения; NaN/0/отрицательное — фоллбэк на 1.
export function parseAdminPage(pageParam: string | undefined): number {
  const parsed = Number.parseInt(pageParam ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// Раньше страница считала offset по нескламленному `page`, а `AdminPagination` получал уже
// клампнутый `Math.min(page, pageCount)` — при `?page=999` (протухшая ссылка/ручной ввод) это
// давало пустую таблицу под пагинацией, уверенно подсвечивающей "валидную" последнюю страницу.
// redirect() на канонический URL до рендера держит offset запроса и то, что показывает
// AdminPagination, всегда в синхроне — вызывающая сторона может передавать `page` в
// AdminPagination напрямую, без отдельного Math.min.
export function redirectIfPageOutOfRange(page: number, pageCount: number, basePath: string): void {
  if (page > pageCount) {
    redirect(pageCount <= 1 ? basePath : `${basePath}?page=${pageCount}`);
  }
}

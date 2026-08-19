import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { UiPlaygroundClient } from './UiPlaygroundClient';

// Dev-песочница компонентов — полезна, пока формы ещё не подключены к реальным Server Actions
// (см. CLAUDE.md). В финальной сборке отдаём 404, а не удаляем файл: страница остаётся под рукой
// для локальной разработки, но не попадает в то, что видит пользователь на проде.
export default async function UiPlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { locale } = await params;
  setRequestLocale(locale);

  return <UiPlaygroundClient />;
}

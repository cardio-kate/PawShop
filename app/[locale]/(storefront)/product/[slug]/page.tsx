import { setRequestLocale } from 'next-intl/server';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-container items-center justify-center px-lg py-3xl">
      <p className="text-h2 text-neutral-300">Product page — coming soon</p>
    </div>
  );
}

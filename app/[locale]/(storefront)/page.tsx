import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutSection } from '@/components/home/AboutSection';
import { ValuePropsSection } from '@/components/home/ValuePropsSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  return { title: t('title'), description: t('metaDescription') };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    // gap-[40px] на мобильном (по прямому запросу, было 60px), sm:gap-[60px] — design.md →
    // Typography, «между секциями — 60px».
    <div
      className={`${STOREFRONT_PAGE_CONTAINER_CLASSNAME} flex flex-col gap-[40px] sm:gap-[60px]`}
    >
      {/* Дизайн не закладывает видимый h1 на главной (AboutSection начинается сразу с h2,
          design.md) — sr-only, а не видимый заголовок, чтобы не менять вёрстку; тот же паттерн,
          что у StaffLoginCard.tsx. У страницы нет одного слова-заголовка (несколько секций),
          поэтому текст — сам title метадаты, не название секции. */}
      <h1 className="sr-only">{t('title')}</h1>
      <AboutSection />
      <ValuePropsSection />
      <NewArrivalsSection />
    </div>
  );
}

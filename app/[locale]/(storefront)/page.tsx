import { setRequestLocale } from 'next-intl/server';
import { AboutSection } from '@/components/home/AboutSection';
import { ValuePropsSection } from '@/components/home/ValuePropsSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // gap-[40px] на мобильном (по прямому запросу, было 60px), sm:gap-[60px] — design.md →
    // Typography, «между секциями — 60px».
    <div
      className={`${STOREFRONT_PAGE_CONTAINER_CLASSNAME} flex flex-col gap-[40px] sm:gap-[60px]`}
    >
      <AboutSection />
      <ValuePropsSection />
      <NewArrivalsSection />
    </div>
  );
}

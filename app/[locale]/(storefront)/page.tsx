import { setRequestLocale } from 'next-intl/server';
import { AboutSection } from '@/components/home/AboutSection';
import { ValuePropsSection } from '@/components/home/ValuePropsSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-container px-lg mx-auto flex flex-col gap-[60px] pt-[60px]">
      <AboutSection />
      <NewArrivalsSection />
      <ValuePropsSection />
    </div>
  );
}

import { ImageIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// design.md → Layout: секция About выполняет роль промо-баннера главной страницы (§7.2 ТЗ) —
// отдельного баннер-блока с картинкой/слайдером нет намеренно, эту роль берёт на себя текст +
// paw-tint-panel. design.md → Typography: заголовок центрирован (typography.section-heading),
// многострочный абзац внутри панели остаётся по левому краю — центрирование вредит читаемости.
export async function AboutSection() {
  const t = await getTranslations('Home.about');

  return (
    <section id="about" className="scroll-mt-20">
      <div className="gap-sm flex flex-col items-center text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading text-neutral-900 uppercase">{t('title')}</h2>
      </div>

      <div className="mt-lg bg-paw-tint p-xl rounded-2xl text-left">
        <div className="gap-lg flex flex-col items-stretch sm:flex-row">
          {/* Плейсхолдер до реального ассета — размер ещё не определён, поэтому sm:w-1/2 + stretch,
              не фиксированный px. aspect-square только до sm, где sm:flex-row/stretch ещё не задаёт
              высоту сама. */}
          <div
            className="bg-surface flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 sm:aspect-auto sm:w-1/2"
            aria-hidden="true"
          >
            <ImageIcon className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          </div>

          <div className="gap-md text-body-md flex w-full flex-col justify-center text-neutral-900 sm:w-1/2">
            <p>{t('paragraph1')}</p>
            <p>{t('paragraph2')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

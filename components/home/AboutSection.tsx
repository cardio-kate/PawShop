import { getTranslations } from 'next-intl/server';

// design.md → Layout: секция About выполняет роль промо-баннера главной страницы (§7.2 ТЗ) —
// отдельного баннер-блока с картинкой/слайдером нет намеренно, эту роль берёт на себя текст +
// paw-tint-panel. design.md → Typography: заголовок центрирован (typography.section-heading),
// многострочный абзац внутри панели остаётся по левому краю — центрирование вредит читаемости.
export async function AboutSection() {
  const t = await getTranslations('Home.about');

  return (
    <section id="about" className="scroll-mt-20">
      <div className="flex flex-col items-center gap-sm text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading uppercase text-neutral-900">{t('title')}</h2>
      </div>

      <div className="mt-lg rounded-2xl bg-paw-tint p-xl text-left">
        <div className="mx-auto flex max-w-reading flex-col gap-md text-body-md text-neutral-900">
          <p>{t('paragraph1')}</p>
          <p>{t('paragraph2')}</p>
        </div>
      </div>
    </section>
  );
}

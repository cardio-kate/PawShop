import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { SECTION_HEADING_GAP_CLASSNAME } from '@/components/home/section-styles';

// design.md → Layout: секция About выполняет роль промо-баннера главной страницы (§7.2 ТЗ) —
// отдельного баннер-блока с картинкой/слайдером нет намеренно, эту роль берёт на себя текст +
// paw-tint-panel (design.md фиксирует именно этот фон — отступление ниже не задокументировано,
// см. коммент про bg-paw-tint). design.md → Typography: заголовок центрирован
// (typography.section-heading), многострочный абзац внутри панели остаётся по левому краю —
// центрирование вредит читаемости.
export async function AboutSection() {
  const t = await getTranslations('Home.about');

  return (
    // bg-paw-tint убран по запросу — с уменьшенным фото (350px) вокруг него оставалось много
    // пустого тонированного поля, читалось как серый фон, а не панель под контентом. p-xl (40px)
    // был калиброван под этот фон (паддинг ≥ радиуса, иначе скругление «ест» контент по углам) —
    // без фона это уже не нужно, вместе с px-lg (24px) обёртки HomePage получалось двойное
    // 64px-поле по бокам на мобильном, отсюда и обрезанная до ~230px колонка текста. p-lg (24px),
    // как у ValuePropsSection/NewArrivalsSection ниже.
    <section id="about" className="px-lg pb-lg scroll-mt-20 rounded-2xl">
      <div className="gap-sm flex flex-col items-center text-center">
        <p className="text-label-caps text-neutral-700">{t('eyebrow')}</p>
        <h2 className="text-section-heading font-display text-neutral-900 uppercase">{t('title')}</h2>
      </div>

      <div
        className={`${SECTION_HEADING_GAP_CLASSNAME} gap-lg flex flex-col items-center text-left lg:flex-row lg:items-stretch`}
      >
        {/* about.jpg — реальный ассет. Ширина фиксирована (350px), высота подстраивается под
            реальную пропорцию файла (1264×842) — width/height ниже это интринсик-размеры файла
            (для расчёта соотношения и next/image-оптимизации), h-auto в className держит их
            пропорционально при отображении, поэтому не нужен object-cover — кадр не обрезается,
            box и так совпадает с реальным соотношением сторон. Тот же приём, что у cat.png в
            ValuePropsSection (width/height — интринсик, className — фактический размер показа).
            max-w-full — иначе на видовых экранах уже 350px обходит вправо через край секции, и
            заодно даёт пропорциональное уменьшение картинки на узких/средних экранах (640–1024px
            в стек-раскладке ниже), а не обрезку.

            Брейкпоинт ряда — lg (1024px), не sm (640px): на 640–1024px рядом с фикс. 350px-фото
            текстовой колонке (flex-1) оставалось слишком мало места, а под items-stretch h-auto
            не защищает от растяжения по высоте — если текст оказывался выше интринсик-высоты
            фото, flex растягивал box картинки, а <img> без object-fit по умолчанию тянет (fill)
            содержимое, искажая кадр. До lg — обычный вертикальный стек (фото по центру, текст под
            ним), с lg — ряд; lg:self-start на самой картинке — доп. страховка от того же
            растяжения и на широких экранах, если текст всё же окажется длиннее фото. */}
        <Image
          src="/home/about.jpg"
          alt=""
          width={1264}
          height={842}
          sizes="350px"
          className="h-auto w-[350px] max-w-full shrink-0 rounded-2xl lg:self-start"
          aria-hidden="true"
          // CLAUDE.md → «Загрузка изображений»: priority для первого экрана — About открывает
          // главную страницу, hero-контент выше сгиба, без priority грузился loading="lazy" и не
          // подхватывался сразу.
          priority
        />

        {/* max-w-[600px] — комфортная длина строки для сплошного абзаца (тот же принцип, что
            max-w-reading/680px у Privacy Policy), не даёт колонке растягиваться на всю ширину
            ряда при большом зазоре с картинкой на широких экранах. justify-start — без
            lg-исключения: текст прижат к верху блока на любой ширине, не только в стеке. */}
        <div className="gap-md text-body-md flex w-full max-w-[600px] flex-1 flex-col justify-start text-neutral-900">
          <p>{t('paragraph1')}</p>
          <p>{t('paragraph2')}</p>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

// design.md → Imagery: первым и основным кадром всегда студийное фото (то же, что на карточке
// каталога), доп. lifestyle-кадры — необязательны. Мок-товары несут по одному фото — миниатюры
// под главным кадром рендерятся только если их реально больше одной, чтобы не показывать полосу
// из единственного дублирующего себя превью.
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] ?? images[0]!;

  return (
    // min-[641px]:, не sm: (=640px) — грид-родитель в page.tsx переключается на два столбца
    // ровно на min-[641px], тем же граничным значением, что и мобильное центрирование в
    // ProductDetailClient.tsx; sm:mx-0 снимал бы центрирование колонки на 640px, когда грид ещё
    // однoколоночный — фото уезжало бы к левому краю вместо центра.
    <div className="gap-sm mx-auto flex w-full max-w-[360px] flex-col min-[641px]:mx-0">
      {/* aspect-[4/5], не aspect-square — тот же прямоугольный кадр, что у product-card в каталоге
          (design.md → Components «Product card»), по прямому запросу. Высота остаётся 450px (та
          же, что раньше у квадрата 450×450) — ширина уменьшается до 360px (450 × 4/5), а не
          наоборот, чтобы не поднимать высоту колонки галереи. */}
      <div className="rounded-card relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Image
          src={selected}
          alt={alt}
          fill
          priority
          // Next 16: priority сам по себе не выставляет fetchpriority="high" (проп независимый,
          // node_modules/next/dist/shared/lib/get-img-props.js) — это LCP-картинка страницы товара.
          fetchPriority="high"
          // sizes отражает реальную отрисованную ширину колонки (page.tsx →
          // clamp(312px, calc(40vw − 48px), 360px)), не формулу клэмпа буквально: между 640 и
          // 900px картинка зафиксирована на полу клэмпа (312px, не убывает дальше), между 900 и
          // 1024px растёт до потолка 360px — единое "(min-width: 900px) 360px" на этот верхний
          // диапазон безопасно (чуть заказывает с запасом, никогда не меньше фактической
          // ширины), а calc(40vw − 48px) в этом же диапазоне ушёл бы ниже 312px и заставил бы
          // next/image запросить более лёгкий (размытый на факте отрисовки) вариант картинки.
          sizes="(min-width: 900px) 360px, (min-width: 640px) 312px, 360px"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="gap-sm flex overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-current={index === selectedIndex}
              aria-label={`${alt} — ${index + 1}`}
              className={`duration-fast relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} ${
                index === selectedIndex ? 'ring-paw ring-2' : ''
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

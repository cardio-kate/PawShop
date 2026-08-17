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
    <div className="gap-sm mx-auto flex w-full max-w-[450px] flex-col sm:mx-0">
      <div className="rounded-card relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={selected}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 450px, (min-width: 640px) calc(50vw - 60px), 450px"
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

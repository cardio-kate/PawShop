'use client';

import { useState } from 'react';
import Image from 'next/image';

// design.md → Imagery: первым и основным кадром всегда студийное фото (то же, что на карточке
// каталога), доп. lifestyle-кадры — необязательны. Мок-товары несут по одному фото — миниатюры
// под главным кадром рендерятся только если их реально больше одной, чтобы не показывать полосу
// из единственного дублирующего себя превью.
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] ?? images[0]!;

  return (
    <div className="flex flex-col gap-sm">
      <div className="relative aspect-square overflow-hidden rounded-card bg-neutral-100">
        <Image
          src={selected}
          alt={alt}
          fill
          priority
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-sm overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-current={index === selectedIndex}
              aria-label={`${alt} — ${index + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw ${
                index === selectedIndex ? 'ring-2 ring-paw' : ''
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

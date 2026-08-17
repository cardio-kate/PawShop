'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import { PRODUCT_MIN_ITEMS } from '@/components/admin/constants';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

function isBlobUrl(src: string): boolean {
  return src.startsWith('blob:');
}

// design.md → ImageUploader: реальный поток — signed client-upload напрямую в Vercel Blob
// (architecture.md §3.5), но .claude/plans/velvety-kindling-planet.md (Фаза 7) явно ограничивает
// этот шаг UI без реальной загрузки. Здесь превью через object URL в памяти вкладки — в отличие от
// исходной версии, revoked не «никогда»: явно освобождается при удалении фото (handleRemove) и при
// размонтировании формы (эффект ниже, через imagesRef — иначе замыкание держало бы только images
// на момент монтирования, пустой массив).
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);

  // Ref обновляется эффектом (не присваиванием в теле рендера — react-hooks/refs это запрещает),
  // но синхронно относительно commit'а, так что к моменту unmount-эффекта ниже ref уже указывает
  // на актуальный images, а не на тот, что был при монтировании.
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((src) => {
        if (isBlobUrl(src)) URL.revokeObjectURL(src);
      });
    };
  }, []);

  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newUrls = Array.from(files).map((file) => URL.createObjectURL(file));
    onChange([...images, ...newUrls]);
  }

  function handleSetCover(index: number) {
    const next = [...images];
    const [cover] = next.splice(index, 1);
    next.unshift(cover!);
    onChange(next);
  }

  function handleRemove(index: number) {
    const removed = images[index];
    if (removed && isBlobUrl(removed)) URL.revokeObjectURL(removed);
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="gap-sm flex flex-col">
      <span className="text-label-md text-neutral-900">Photos</span>
      <div className="gap-sm flex flex-wrap">
        {images.map((src, index) => (
          <div
            key={src}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100"
          >
            <Image src={src} alt="" fill sizes="96px" unoptimized className="object-cover" />
            {index === 0 ? (
              <span className="text-label-caps text-surface absolute bottom-1 left-1 rounded-full bg-neutral-900/70 px-2 py-0.5">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetCover(index)}
                className={`text-surface duration-fast absolute inset-x-0 bottom-0 bg-neutral-900/70 py-1 text-center text-[10px] leading-none font-semibold whitespace-nowrap opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
              >
                Set as cover
              </button>
            )}
            {/* §10 ТЗ: товар без единой фотографии сохранить нельзя — то же правило, что у
                последнего варианта в VariantEditor, применено здесь тем же способом (кнопка
                удаления скрыта, а не задизейблена). p-1.5 вокруг h-3.5 иконки — тач-таргет 26px,
                проходит минимум 24×24 (WCAG 2.5.8); h-3 w-3 + p-1 давали только ~20px. */}
            {images.length > PRODUCT_MIN_ITEMS && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className={`text-surface duration-fast absolute top-1 right-1 cursor-pointer rounded-full bg-neutral-900/70 p-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-neutral-900 focus:opacity-100 motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add photo"
          className={`duration-fast hover:border-paw hover:text-paw flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-500 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
          className="sr-only"
        />
      </div>
    </div>
  );
}

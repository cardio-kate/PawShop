'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

// design.md → ImageUploader: реальный поток — signed client-upload напрямую в Vercel Blob
// (architecture.md §3.5), но .claude/plans/velvety-kindling-planet.md (Фаза 7) явно ограничивает
// этот шаг UI без реальной загрузки. Здесь превью через object URL в памяти вкладки (revoked нигде
// не вызывается — форма живёт до навигации, страница целиком выгружает объект вместе с URL).
// unoptimized — next/image иначе пытается резолвить blob:-URL через remotePatterns, как обычный
// внешний хост, и падает: у blob: URL нет hostname, который можно было бы туда вписать.
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-sm">
      <span className="text-label-md text-neutral-900">Photos</span>
      <div className="flex flex-wrap gap-sm">
        {images.map((src, index) => (
          <div key={src} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
            <Image src={src} alt="" fill sizes="96px" unoptimized className="object-cover" />
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-neutral-900/70 px-2 py-0.5 text-label-caps text-surface">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetCover(index)}
                className="absolute inset-x-0 bottom-0 whitespace-nowrap bg-neutral-900/70 py-1 text-center text-[10px] font-semibold leading-none text-surface opacity-0 transition-opacity duration-fast focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
              >
                Set as cover
              </button>
            )}
            {/* §10 ТЗ: товар без единой фотографии сохранить нельзя — то же правило, что у
                последнего варианта в VariantEditor, применено здесь тем же способом (кнопка
                удаления скрыта, а не задизейблена). p-1.5 вокруг h-3.5 иконки — тач-таргет 26px,
                проходит минимум 24×24 (WCAG 2.5.8); h-3 w-3 + p-1 давали только ~20px. */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-neutral-900/70 p-1.5 text-surface opacity-0 transition-opacity duration-fast hover:bg-neutral-900 focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
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
          className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-500 transition-colors duration-fast hover:border-paw hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
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

'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { put } from '@vercel/blob/client';
import { Plus, X } from 'lucide-react';
import { PRODUCT_MIN_ITEMS } from '@/components/admin/constants';
import {
  PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
} from '@/lib/constants';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { getProductImageUploadToken } from '@/actions/products.actions';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

// architecture.md §3.5: файл не идёт через тело Server Action. Поток за один выбранный файл —
// getProductImageUploadToken() (маленький action, только выдаёт токен) → put() из
// '@vercel/blob/client' грузит файл напрямую в Blob, минуя Next.js-сервер → в форму попадает
// только настоящий https-URL. MIME/размер проверяются здесь для мгновенного UX и ещё раз на
// сервере при выдаче токена (клиенту не доверяем ни то, ни другое) — та же константа с обеих
// сторон (lib/constants.ts), чтобы проверки не разошлись.
async function uploadOne(file: File): Promise<{ url: string } | { error: string }> {
  if (!(PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return { error: `${file.name}: unsupported file type` };
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    return { error: `${file.name}: file is too large (max 5 MB)` };
  }

  const tokenResult = await getProductImageUploadToken({ contentType: file.type });
  if (!tokenResult.success) {
    return { error: `${file.name}: ${Object.values(tokenResult.errors)[0] ?? 'upload failed'}` };
  }

  const blob = await put(tokenResult.data.pathname, file, {
    access: 'public',
    token: tokenResult.data.token,
    contentType: file.type,
  });
  return { url: blob.url };
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);

    const uploaded: string[] = [];
    const errors: string[] = [];
    // Последовательно, не Promise.all — каталог небольшой, за раз выбирают единицы файлов;
    // так проще собрать частичный успех (часть файлов не подошла по типу/размеру) без гонки
    // за общий uploaded/errors.
    for (const file of Array.from(files)) {
      const result = await uploadOne(file);
      if ('error' in result) {
        errors.push(result.error);
      } else {
        uploaded.push(result.url);
      }
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded]);
    if (errors.length > 0) setError(errors.join('; '));
    setIsUploading(false);
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
    <div className="gap-sm flex flex-col">
      <span className="text-label-md text-neutral-900">Photos</span>
      <div className="gap-sm flex flex-wrap">
        {images.map((src, index) => (
          <div
            key={src}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100"
          >
            <Image src={src} alt="" fill sizes="96px" className="object-cover" />
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
          disabled={isUploading}
          aria-label={isUploading ? 'Uploading…' : 'Add photo'}
          aria-busy={isUploading}
          className={`duration-fast hover:border-paw hover:text-paw flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-500 transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING_CLASSNAME}`}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES.join(',')}
          multiple
          onChange={(e) => {
            void handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
          className="sr-only"
        />
      </div>
      {error && (
        <span role="alert" className="text-body-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}

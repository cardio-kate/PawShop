import 'server-only';
import { randomUUID } from 'node:crypto';
import { del } from '@vercel/blob';
// generateClientTokenFromReadWriteToken — экспорт из '@vercel/blob/client', не из корня пакета
// (сверено с node_modules/@vercel/blob/dist/client.d.ts, а не с обучающими данными — AGENTS.md).
// Несмотря на "client" в пути, функция серверная: подписывает токен секретным
// BLOB_READ_WRITE_TOKEN, который не должен попасть в браузер.
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import {
  PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
} from '@/lib/constants';
import type { StorageProvider, UploadToken, UploadTokenParams } from './storage.interface';

// contentType -> расширение файла, не берётся из клиентского имени файла (клиенту не доверяем,
// architecture.md §3.5). Единственный источник расширений — тот же список, что ограничивает
// allowedContentTypes ниже, так что оба места не могут разойтись по составу форматов.
const EXTENSION_BY_CONTENT_TYPE: Record<
  (typeof PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES)[number],
  string
> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isAllowedContentType(
  contentType: string,
): contentType is (typeof PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES)[number] {
  return (PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType);
}

async function createUploadToken({ contentType }: UploadTokenParams): Promise<UploadToken> {
  if (!isAllowedContentType(contentType)) {
    throw new Error(`vercel-blob.provider: unsupported content type "${contentType}"`);
  }

  const pathname = `products/${randomUUID()}.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;

  // 'access' здесь не параметр (сверено с GenerateClientTokenOptions в client.d.ts — в отличие от
  // put()/upload(), у generateClientTokenFromReadWriteToken его нет вообще); публичность задаётся на
  // клиентском put() при реальной загрузке (следующий шаг фазы — переподключение ImageUploader).
  const token = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: [...PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES],
    maximumSizeInBytes: PRODUCT_IMAGE_MAX_SIZE_BYTES,
    addRandomSuffix: false, // уникальность уже даёт randomUUID() в pathname
  });

  return { token, pathname };
}

// architecture.md §3.5: при замене/удалении фото товара старые файлы не остаются в Blob навсегда —
// вызывается явно из products.service.ts, не автоматически провайдером.
async function deleteBlob(url: string): Promise<void> {
  await del(url);
}

export const vercelBlobProvider: StorageProvider = {
  createUploadToken,
  delete: deleteBlob,
};

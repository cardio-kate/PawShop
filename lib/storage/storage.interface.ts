// architecture.md §3.5: сервер никогда не получает сам файл — только выдаёт короткоживущий токен на
// прямую загрузку в хранилище (createUploadToken) и, отдельно, чистит старые файлы при замене/
// удалении фото (delete). Ни один метод не пропускает файл через тело Server Action.
//
// Не 'server-only' — это только типы, без рантайм-импортов и секретов; server-only ставится в
// конкретных провайдерах (vercel-blob.provider.ts), не здесь.

export interface UploadTokenParams {
  // Финальный путь блоба выбирает провайдер (uuid), не клиент — чтобы нельзя было передать
  // произвольный/коллизионный pathname через прямой вызов action в обход формы.
  contentType: string;
}

export interface UploadToken {
  token: string;
  pathname: string;
}

export interface StorageProvider {
  createUploadToken(params: UploadTokenParams): Promise<UploadToken>;
  delete(url: string): Promise<void>;
}

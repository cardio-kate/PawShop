import type { MetadataRoute } from 'next';

// TODO: заполнить записями по товарам/статическим страницам через те же queries, что и
// страницы каталога (CLAUDE.md, «Кэш и SEO») — блокировано на lib/db/queries, которых пока нет.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}

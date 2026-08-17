import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // ui-playground — dev-песочница компонентов (захардкоженный английский текст, не часть
      // витрины), не должна индексироваться ни на /en/, ни на /de/. Реальный путь — /en/ui-playground
      // или /de/ui-playground (locale-префикс из [locale]-сегмента), поэтому нужен wildcard перед
      // сегментом — без него Disallow: /ui-playground матчит только корневой путь.
      disallow: ['/admin', '/staff-entry', '/*/ui-playground'],
    },
  };
}

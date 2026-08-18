import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type Messages = Record<string, unknown>;

// defaultLocale (en) как база, locale-специфичные ключи перекрывают её сверху — без merge
// отсутствующий в de.json ключ next-intl не находит вообще и рисует "Namespace.key" прямо на
// странице (see MISSING_MESSAGE), не молчаливый английский текст. Рекурсивный, а не
// Object.assign — большинство namespace вложенные (Home.about.title и т.п.), поверхностный
// merge перезаписал бы весь вложенный объект целиком, даже если в de.json отсутствует только
// один ключ внутри него.
function deepMerge(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const key in override) {
    const overrideValue = override[key];
    const baseValue = result[key];
    if (
      overrideValue &&
      typeof overrideValue === 'object' &&
      !Array.isArray(overrideValue) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(baseValue as Messages, overrideValue as Messages);
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const defaultMessages = (
    (await import(`../messages/${routing.defaultLocale}.json`)) as { default: Messages }
  ).default;
  const messages =
    locale === routing.defaultLocale
      ? defaultMessages
      : deepMerge(
          defaultMessages,
          ((await import(`../messages/${locale}.json`)) as { default: Messages }).default,
        );

  return {
    locale,
    messages,
  };
});

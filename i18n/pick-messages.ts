import type { AbstractIntlMessages } from 'next-intl';

// NextIntlClientProvider без явного messages берёт ВЕСЬ смёрженный JSON локали (getMessages()) —
// все namespace разом, не только те, что нужны конкретной странице. Проверено эмпирически на
// собранном проде: без сужения строки namespace Checkout ("Back to catalog", "Your cart is
// empty.") утекали даже в HTML главной страницы, у которой с чекаутом нет ничего общего.
//
// pickMessages сужает messages до explicit-списка namespace перед передачей в
// NextIntlClientProvider. Root layout (app/[locale]/layout.tsx) передаёt глобальный набор —
// Header/Cart/ErrorBoundary, нужны на каждой странице через Header/CartDrawer/error.tsx. Страницы
// catalog/product/checkout/contact оборачивают свой клиентский компонент ВЛОЖЕННЫМ
// NextIntlClientProvider со своим набором — вложенный provider ПОДМЕНЯЕТ контекст для своего
// поддерева целиком, не объединяет его с родительским, поэтому namespace, нужный и глобально, и
// странице (Cart на checkout — CheckoutClient.tsx вызывает useTranslations('Cart') напрямую),
// обязан быть перечислен и в page-level наборе явно, не только в root.
export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: string[],
): AbstractIntlMessages {
  const result: AbstractIntlMessages = {};
  for (const namespace of namespaces) {
    const value = messages[namespace];
    if (value !== undefined) {
      result[namespace] = value;
    }
  }
  return result;
}

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/ui/Panel';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import {
  getCartSubtotal,
  useResolvedCartItems,
  useUnavailableCartItemCount,
} from './useResolvedCartItems';
import { useRouter } from '@/i18n/navigation';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  const resolvedItems = useResolvedCartItems();
  const unavailableCount = useUnavailableCartItemCount(resolvedItems);

  const subtotalValue = getCartSubtotal(resolvedItems);
  const subtotal = formatPrice(subtotalValue, locale);

  function handleCheckout() {
    onClose();
    router.push('/checkout');
  }

  return (
    <Panel open={open} onClose={onClose} ariaLabel={t('title')} closeLabel={t('close')}>
      <div className="flex h-full flex-col">
        {/* pt-[30px]: заголовок должен сидеть на той же высоте, что кнопка Close (top-md у Panel),
            а не проваливаться далеко вниз под ней. */}
        <h2 className="px-lg text-h3 pt-[30px] text-neutral-900">{t('title')}</h2>

        {/* CLAUDE.md → «Заказ и корзина»: недоступные позиции исключаются с предупреждением, не
            молча — useResolvedCartItems уже отфильтровал их из resolvedItems ниже, это единственное
            место, где пользователь узнаёт, что что-то пропало. role="status": не требует фокуса,
            но озвучивается скринридером при открытии панели. */}
        {unavailableCount > 0 && (
          <p
            role="status"
            className="mx-lg mt-md bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
          >
            {t('unavailableWarning', { count: unavailableCount })}
          </p>
        )}

        {resolvedItems.length === 0 ? (
          <p className="px-lg text-body-md flex flex-1 items-center justify-center text-center text-neutral-500">
            {t('empty')}
          </p>
        ) : (
          <ul className="gap-lg px-lg py-lg flex flex-1 flex-col overflow-y-auto">
            {resolvedItems.map((item) => (
              <CartItem
                key={`${item.productId}-${item.variantId}`}
                product={item.product}
                variant={item.variant}
                quantity={item.quantity}
                locale={locale}
              />
            ))}
          </ul>
        )}

        <CartSummary
          subtotal={subtotal}
          disabled={resolvedItems.length === 0}
          onCheckout={handleCheckout}
        />
      </div>
    </Panel>
  );
}

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/ui/Panel';
import { EmptyStateCat } from '@/components/ui/EmptyStateCat';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { getCartSubtotal, useResolvedCartItems } from './useResolvedCartItems';
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

  const subtotal = formatPrice(getCartSubtotal(resolvedItems), locale);

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

        {resolvedItems.length === 0 ? (
          <div className="px-lg gap-sm flex flex-1 flex-col items-center justify-center text-center">
            <EmptyStateCat />
            <p className="text-body-md text-neutral-700">{t('empty')}</p>
          </div>
        ) : (
          <ul className="gap-lg px-lg py-lg flex flex-1 flex-col overflow-y-auto">
            {resolvedItems.map((item) => (
              <CartItem
                key={`${item.productId}-${item.variantId}`}
                product={item.product}
                variant={item.variant}
                productId={item.productId}
                variantId={item.variantId}
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

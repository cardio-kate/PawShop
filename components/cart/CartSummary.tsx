'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface CartSummaryProps {
  subtotal: string;
  disabled: boolean;
  onCheckout: () => void;
}

// design.md → Components «Cart item»: итоговый блок Sub Total / Shipping & Tax / Total + Checkout
// на всю ширину. Shipping зависит от DeliveryCountry, который выбирается только на /checkout
// (ТЗ §7.5) — панель корзины его ещё не знает, поэтому вместо суммы там текст-плейсхолдер, а Total
// в панели равен Sub Total (не выдаёт цифру, которая заведомо изменится на следующем шаге).
export function CartSummary({ subtotal, disabled, onCheckout }: CartSummaryProps) {
  const t = useTranslations('Cart');

  return (
    <div className="border-t border-neutral-200 px-lg py-lg">
      {/* gap-xs на всех трёх строках разом, а не mt-xs/mt-sm по отдельности — иначе зазор
          Sub Total→Shipping (4px) и Shipping→Total (8px) визуально несимметричны. */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between text-body-sm text-neutral-700">
          <span>{t('subtotal')}</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex items-center justify-between text-body-sm text-neutral-700">
          <span>{t('shipping')}</span>
          <span>{t('shippingNote')}</span>
        </div>
        <div className="flex items-center justify-between text-label-md text-neutral-900">
          <span>{t('total')}</span>
          <span>{subtotal}</span>
        </div>
      </div>
      <Button variant="primary" disabled={disabled} onClick={onCheckout} className="mt-lg w-full">
        {t('checkout')}
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  getCartSubtotal,
  useResolvedCartItems,
  useUnavailableCartItemCount,
} from '@/components/cart/useResolvedCartItems';
import { MOCK_DELIVERY_COUNTRIES } from '@/components/product/mock-data';
import { formatPrice } from '@/lib/utils';

// design.md → Layout «Оформление заказа» (ТЗ §7.5): двухколоночная раскладка от bp-sm — поля
// адреса слева, сводка заказа справа; не помещается в панель корзины (400px), поэтому отдельная
// широкая страница. Шаблон: поля/список товаров/суммы — без react-hook-form/Zod и без createOrder
// (.claude/plans/velvety-kindling-planet.md, Фаза 5 — форма и сабмит нужны backend, вне этого плана).
export function CheckoutClient() {
  const t = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const locale = useLocale();
  const resolvedItems = useResolvedCartItems();
  const unavailableCount = useUnavailableCartItemCount();
  const [countryId, setCountryId] = useState(MOCK_DELIVERY_COUNTRIES[0]!.id);

  if (resolvedItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-md py-3xl text-center">
        <p className="text-body-md text-neutral-500">{t('emptyCart')}</p>
        <Link href="/catalog" className="text-label-md text-paw">
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const subtotal = getCartSubtotal(resolvedItems);
  const selectedCountry = MOCK_DELIVERY_COUNTRIES.find((country) => country.id === countryId) ?? MOCK_DELIVERY_COUNTRIES[0]!;
  const total = subtotal + selectedCountry.price;

  return (
    <div className="grid grid-cols-1 gap-xl sm:grid-cols-2">
      <div className="flex flex-col gap-md">
        <h2 className="text-h3 text-neutral-900">{t('detailsTitle')}</h2>

        <label className="flex flex-col gap-xs">
          <span className="text-label-md text-neutral-900">{t('fields.fullName')}</span>
          <Input name="fullName" autoComplete="name" />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-md text-neutral-900">{t('fields.phone')}</span>
          <Input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-md text-neutral-900">{t('fields.street')}</span>
          <Input name="street" autoComplete="street-address" />
        </label>
        <div className="grid grid-cols-2 gap-md">
          <label className="flex flex-col gap-xs">
            <span className="text-label-md text-neutral-900">{t('fields.city')}</span>
            <Input name="city" autoComplete="address-level2" />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="text-label-md text-neutral-900">{t('fields.postalCode')}</span>
            <Input name="postalCode" autoComplete="postal-code" />
          </label>
        </div>
        <label className="flex flex-col gap-xs">
          <span className="text-label-md text-neutral-900">{t('fields.country')}</span>
          {/* Выбор страны меняет Shipping в сводке справа — единственный кусок реальной логики
              в этом шаблоне, остальные поля ни на что не влияют (нет ни валидации, ни сабмита). */}
          <Select name="country" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
            {MOCK_DELIVERY_COUNTRIES.map((country) => (
              <option key={country.id} value={country.id}>
                {country.countryName}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-md text-neutral-900">{t('fields.comment')}</span>
          <textarea
            name="comment"
            rows={3}
            className="w-full rounded-md border border-neutral-300 bg-surface px-md py-[12px] text-body-md text-neutral-900 outline-none transition-colors duration-fast focus:border-paw motion-reduce:transition-none"
          />
        </label>
      </div>

      <div className="flex flex-col gap-md">
        <h2 className="text-h3 text-neutral-900">{t('summaryTitle')}</h2>

        {/* Тот же предупреждающий баннер, что в CartDrawer.tsx — тут особенно важен: total ниже
            считается уже без недоступных позиций, пользователь должен понимать, почему сумма
            меньше ожидаемой, а не молча видеть заниженный итог. */}
        {unavailableCount > 0 && (
          <p role="status" className="rounded-md bg-error-tint px-md py-sm text-body-sm text-error-on-tint">
            {tCart('unavailableWarning', { count: unavailableCount })}
          </p>
        )}

        <ul className="flex flex-col gap-sm">
          {resolvedItems.map((item) => (
            <li
              key={`${item.productId}-${item.variantId}`}
              className="flex items-center justify-between gap-sm text-body-sm text-neutral-700"
            >
              <span>
                {item.product.name} · {item.variant.label} × {item.quantity}
              </span>
              <span className="shrink-0 text-neutral-900">{formatPrice(item.variant.price * item.quantity, locale)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-md border-t border-neutral-200 pt-md">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between text-body-sm text-neutral-700">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-neutral-700">
              <span>{t('shipping')}</span>
              <span>{formatPrice(selectedCountry.price, locale)}</span>
            </div>
            <div className="flex items-center justify-between text-label-md text-neutral-900">
              <span>{t('total')}</span>
              <span>{formatPrice(total, locale)}</span>
            </div>
          </div>

          {/* disabled, не onClick-заглушка: createOrder ещё не существует (нужен backend), а
              задизейбленная кнопка не выглядит рабочей и не создаёт ложных ожиданий на этом шаге. */}
          <Button variant="primary" disabled className="mt-lg w-full">
            {t('placeOrder')}
          </Button>
        </div>
      </div>
    </div>
  );
}

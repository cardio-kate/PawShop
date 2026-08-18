'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
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
  const unavailableCount = useUnavailableCartItemCount(resolvedItems);
  const [countryId, setCountryId] = useState(MOCK_DELIVERY_COUNTRIES[0]!.id);

  if (resolvedItems.length === 0) {
    return (
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <p className="text-body-md text-neutral-500">{t('emptyCart')}</p>
        <Link href="/catalog" className="text-label-md text-paw">
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const subtotal = getCartSubtotal(resolvedItems);
  const selectedCountry =
    MOCK_DELIVERY_COUNTRIES.find((country) => country.id === countryId) ??
    MOCK_DELIVERY_COUNTRIES[0]!;
  const total = subtotal + selectedCountry.price;

  return (
    <div className="gap-xl grid grid-cols-1 sm:grid-cols-2">
      <div className="gap-md flex flex-col">
        <h2 className="text-h3 text-neutral-900">{t('detailsTitle')}</h2>

        <label className="gap-xs flex flex-col">
          <span className="text-label-md text-neutral-900">{t('fields.fullName')}</span>
          <Input name="fullName" autoComplete="name" />
        </label>
        <label className="gap-xs flex flex-col">
          <span className="text-label-md text-neutral-900">{t('fields.phone')}</span>
          <Input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label className="gap-xs flex flex-col">
          <span className="text-label-md text-neutral-900">{t('fields.street')}</span>
          <Input name="street" autoComplete="street-address" />
        </label>
        <div className="gap-md grid grid-cols-2">
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.city')}</span>
            <Input name="city" autoComplete="address-level2" />
          </label>
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.postalCode')}</span>
            <Input name="postalCode" autoComplete="postal-code" />
          </label>
        </div>
        <label className="gap-xs flex flex-col">
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
        <label className="gap-xs flex flex-col">
          <span className="text-label-md text-neutral-900">{t('fields.comment')}</span>
          <Textarea name="comment" rows={3} />
        </label>
      </div>

      <div className="gap-md flex flex-col">
        <h2 className="text-h3 text-neutral-900">{t('summaryTitle')}</h2>

        {/* Тот же предупреждающий баннер, что в CartDrawer.tsx — тут особенно важен: total ниже
            считается уже без недоступных позиций, пользователь должен понимать, почему сумма
            меньше ожидаемой, а не молча видеть заниженный итог. */}
        {unavailableCount > 0 && (
          <p
            role="status"
            className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
          >
            {tCart('unavailableWarning', { count: unavailableCount })}
          </p>
        )}

        <ul className="gap-sm flex flex-col">
          {resolvedItems.map((item) => (
            <li
              key={`${item.productId}-${item.variantId}`}
              className="gap-sm text-body-sm flex items-center justify-between text-neutral-700"
            >
              <span>
                {item.product.name} · {item.variant.label} × {item.quantity}
              </span>
              <span className="shrink-0 text-neutral-900">
                {formatPrice(item.variant.price * item.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-md pt-md border-t border-neutral-200">
          <div className="gap-xs flex flex-col">
            <div className="text-body-sm flex items-center justify-between text-neutral-700">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="text-body-sm flex items-center justify-between text-neutral-700">
              <span>{t('shipping')}</span>
              <span>{formatPrice(selectedCountry.price, locale)}</span>
            </div>
            <div className="text-label-md flex items-center justify-between text-neutral-900">
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

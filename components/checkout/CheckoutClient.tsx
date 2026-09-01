'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  getCartSubtotal,
  useResolvedCartItems,
  type ResolvedCartItem,
} from '@/components/cart/useResolvedCartItems';
import { useCartStore } from '@/lib/store/cart.store';
import { createOrder } from '@/actions/orders.actions';
import { orderSchema, type OrderInput } from '@/lib/validation/order.schema';
import { formatPrice } from '@/lib/utils';
import { add, multiplyByQuantity } from '@/lib/money';
import type { DeliveryCountryRow } from '@/lib/db/queries/delivery.queries';

interface CheckoutClientProps {
  countries: DeliveryCountryRow[];
}

interface OrderResult {
  id: number;
  unavailableCount: number;
}

// items — снапшот корзины на момент сабмита, не поле формы (order.schema.ts, комментарий у items).
function toItemsPayload(items: ResolvedCartItem[]): OrderInput['items'] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));
}

// design.md → Layout «Оформление заказа» (ТЗ §7.5): двухколоночная раскладка от bp-sm — поля
// адреса слева, сводка заказа справа; экран подтверждения (то же ТЗ §7.5) заменяет обе колонки после
// успешного createOrder, не модалка поверх формы.
export function CheckoutClient({ countries }: CheckoutClientProps) {
  const t = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const locale = useLocale();
  const resolvedItems = useResolvedCartItems();
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      comment: '',
      deliveryCountryId: countries[0]?.id,
      items: toItemsPayload(resolvedItems),
    },
  });

  // useCartStore персистится с skipHydration: true (lib/store/cart.store.ts) — на первом рендере,
  // когда считаются defaultValues выше, стор ещё не гидратирован и resolvedItems пуст. useForm
  // капturит defaultValues только один раз при инициализации, поэтому без явной синхронизации
  // items в RHF-состоянии остался бы [] навсегда, даже когда экран уже показывает настоящую корзину
  // — zodResolver отклонял бы любой сабмит с errors.items.empty. shouldValidate: false — эта
  // синхронизация не должна сама провоцировать показ ошибок до первого реального сабмита.
  useEffect(() => {
    setValue('items', toItemsPayload(resolvedItems), { shouldValidate: false });
  }, [resolvedItems, setValue]);

  const selectedCountryId = watch('deliveryCountryId');

  async function onSubmit(data: OrderInput) {
    // items/comment пересобираются здесь, а не берутся из RHF-состояния как есть: items — всегда
    // свежий снапшот живой корзины (могла измениться после маунта формы), пустой comment схлопывается
    // в undefined, не отправляется пустой строкой.
    const payload: OrderInput = {
      ...data,
      comment: data.comment?.trim() || undefined,
      items: toItemsPayload(resolvedItems),
    };

    try {
      const result = await createOrder(payload);
      if (!result.success) {
        // message остаётся ключом перевода ('errors.field.…'), не переведённой строкой — zodResolver
        // (клиентская валидация) кладёт в errors тот же формат напрямую из схемы, без прогона через
        // t(); единая точка перевода — рендер ниже (fieldError()), не место, где ошибка возникла.
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof OrderInput, { message });
        }
        return;
      }
      // Только после успешного ответа сервера (CLAUDE.md → «Заказ и корзина») — не оптимистично.
      clearCart();
      setOrderResult(result.data);
    } catch {
      setError('root', { message: 'errors.generic' });
    }
  }

  // Единая точка перевода — errors.field.message ВСЕГДА ключ, независимо от источника (zodResolver
  // на клиенте кладёт message из orderSchema напрямую, setError выше — тоже ключ, не переведённую
  // строку); render — единственное место, где он превращается в текст.
  function fieldError(message?: string): string | undefined {
    return message ? t(message) : undefined;
  }

  if (orderResult) {
    return (
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <h2 className="text-h3 text-neutral-900">{t('confirmation.title')}</h2>
        <p className="text-body-md text-neutral-700">
          {t('confirmation.message', { id: orderResult.id })}
        </p>
        {orderResult.unavailableCount > 0 && (
          <p role="alert" className="text-body-sm text-neutral-700">
            {tCart('unavailableWarning', { count: orderResult.unavailableCount })}
          </p>
        )}
        <Link href="/catalog" className="text-label-md text-paw">
          {t('confirmation.continueShopping')}
        </Link>
      </div>
    );
  }

  if (resolvedItems.length === 0) {
    return (
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <p className="text-body-md text-neutral-700">{t('emptyCart')}</p>
        <Link href="/catalog" className="text-label-md text-paw">
          {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const subtotal = getCartSubtotal(resolvedItems);
  const selectedCountry = countries.find((country) => country.id === selectedCountryId) ?? countries[0];
  const shippingPrice = selectedCountry?.price ?? '0.00';
  const total = add(subtotal, shippingPrice);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="gap-xl grid grid-cols-1 sm:grid-cols-2">
        <div className="gap-md flex flex-col">
          <h2 className="text-h3 text-neutral-900">{t('detailsTitle')}</h2>

          {errors.root && (
            <p
              role="alert"
              className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
            >
              {fieldError(errors.root.message)}
            </p>
          )}

          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.fullName')}</span>
            <Input
              {...register('customerName')}
              autoComplete="name"
              error={!!errors.customerName}
              aria-describedby={errors.customerName ? 'fullName-error' : undefined}
            />
            {errors.customerName && (
              <span id="fullName-error" role="alert" className="text-body-sm text-error">
                {fieldError(errors.customerName.message)}
              </span>
            )}
          </label>
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.phone')}</span>
            <Input
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              error={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <span id="phone-error" role="alert" className="text-body-sm text-error">
                {fieldError(errors.phone.message)}
              </span>
            )}
          </label>
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.street')}</span>
            <Input
              {...register('street')}
              autoComplete="street-address"
              error={!!errors.street}
              aria-describedby={errors.street ? 'street-error' : undefined}
            />
            {errors.street && (
              <span id="street-error" role="alert" className="text-body-sm text-error">
                {fieldError(errors.street.message)}
              </span>
            )}
          </label>
          <div className="gap-md grid grid-cols-2">
            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">{t('fields.city')}</span>
              <Input
                {...register('city')}
                autoComplete="address-level2"
                error={!!errors.city}
                aria-describedby={errors.city ? 'city-error' : undefined}
              />
              {errors.city && (
                <span id="city-error" role="alert" className="text-body-sm text-error">
                  {fieldError(errors.city.message)}
                </span>
              )}
            </label>
            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">{t('fields.postalCode')}</span>
              <Input
                {...register('postalCode')}
                autoComplete="postal-code"
                error={!!errors.postalCode}
                aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
              />
              {errors.postalCode && (
                <span id="postalCode-error" role="alert" className="text-body-sm text-error">
                  {fieldError(errors.postalCode.message)}
                </span>
              )}
            </label>
          </div>
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.country')}</span>
            {/* Выбор страны меняет Shipping в сводке справа через watch('deliveryCountryId'). */}
            <Select
              {...register('deliveryCountryId', { valueAsNumber: true })}
              error={!!errors.deliveryCountryId}
              aria-describedby={errors.deliveryCountryId ? 'country-error' : undefined}
            >
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.countryName}
                </option>
              ))}
            </Select>
            {errors.deliveryCountryId && (
              <span id="country-error" role="alert" className="text-body-sm text-error">
                {fieldError(errors.deliveryCountryId.message)}
              </span>
            )}
          </label>
          <label className="gap-xs flex flex-col">
            <span className="text-label-md text-neutral-900">{t('fields.comment')}</span>
            <Textarea {...register('comment')} rows={3} />
          </label>
        </div>

        <div className="gap-md flex flex-col">
          <h2 className="text-h3 text-neutral-900">{t('summaryTitle')}</h2>

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
                  {formatPrice(multiplyByQuantity(item.variant.price, item.quantity), locale)}
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
                <span>{formatPrice(shippingPrice, locale)}</span>
              </div>
              <div className="text-label-md flex items-center justify-between text-neutral-900">
                <span>{t('total')}</span>
                <span>{formatPrice(total, locale)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="mt-lg w-full"
            >
              {isSubmitting ? t('placingOrder') : t('placeOrder')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

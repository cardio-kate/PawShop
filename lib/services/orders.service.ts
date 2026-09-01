import 'server-only';
import { checkRateLimit } from '@/lib/rate-limit';
import { getVariantsForOrder } from '@/lib/db/queries/products.queries';
import { getDeliveryCountryById } from '@/lib/db/queries/delivery.queries';
import { getAdminTelegramChatId } from '@/lib/db/queries/admin.queries';
import { createOrderWithItems, type OrderItemWriteData } from '@/lib/db/queries/orders.queries';
import { sendOrderNotification } from '@/lib/telegram';
import { add, multiplyByQuantity, sum } from '@/lib/money';
import { EIRCODE_PATTERN } from '@/lib/validation/order.schema';
import type { OrderInput } from '@/lib/validation/order.schema';

// product-spec.md §7.5/§12, CLAUDE.md → «Заказ и корзина»: сервер пересчитывает сумму и берёт цены
// из БД, клиентским total/ценам не доверяет никогда; недоступные позиции исключаются с
// предупреждением, не блокируют весь заказ — если после фильтрации не осталось ни одной, заказ без
// единого OrderItem не создаётся вообще (план Фазы 4, решено явно, не отдано на усмотрение).

export type CreateOrderError =
  | 'rate_limited'
  | 'invalid_country'
  | 'invalid_postal_code'
  | 'no_available_items';

export type CreateOrderResult =
  | { success: true; data: { id: number; unavailableCount: number } }
  | { success: false; error: CreateOrderError };

export async function createOrder(input: OrderInput): Promise<CreateOrderResult> {
  // architecture.md §3.8: проверка вызывается первым шагом, до любой мутации/чтения — превышение
  // лимита не должно стоить лишнего запроса к БД за страной доставки и т.д.
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'rate_limited' };
  }

  const country = await getDeliveryCountryById(input.deliveryCountryId);
  if (!country || !country.isActive) {
    return { success: false, error: 'invalid_country' };
  }

  // order.schema.ts уже проверила общий мягкий формат индекса — здесь только доп. строгая проверка
  // для Ирландии (единственное согласованное исключение), которую схема сама сделать не может: она
  // не знает реальный countryName из БД, только числовой deliveryCountryId.
  if (country.countryName === 'Ireland' && !EIRCODE_PATTERN.test(input.postalCode)) {
    return { success: false, error: 'invalid_postal_code' };
  }

  const variantIds = input.items.map((item) => item.variantId);
  const variantRows = await getVariantsForOrder(variantIds);
  const variantById = new Map(variantRows.map((row) => [row.variantId, row]));

  // Товар удалён/деактивирован после того, как лёг в корзину — исключается молча (CheckoutClient
  // сообщает клиенту через unavailableCount в ответе, не блокирует остальные позиции). Сверка
  // productId — защита от рассинхронизации клиентского снапшота корзины с текущим productId
  // варианта (variantId не мог "переехать" на другой товар в этой схеме, но лишняя проверка дёшева).
  const availableItems: OrderItemWriteData[] = input.items.flatMap((item) => {
    const variant = variantById.get(item.variantId);
    if (
      !variant ||
      variant.productId !== item.productId ||
      !variant.productIsActive ||
      !variant.variantIsActive
    ) {
      return [];
    }
    return [
      {
        productId: variant.productId,
        variantId: variant.variantId,
        quantity: item.quantity,
        priceAtOrder: variant.price,
        productNameAtOrder: variant.productName,
        variantLabelAtOrder: variant.variantLabel,
      },
    ];
  });

  if (availableItems.length === 0) {
    return { success: false, error: 'no_available_items' };
  }

  const unavailableCount = input.items.length - availableItems.length;
  const subtotal = sum(
    availableItems.map((item) => multiplyByQuantity(item.priceAtOrder, item.quantity)),
  );
  const total = add(subtotal, country.price);
  const comment = input.comment?.trim() ? input.comment.trim() : null;

  const orderId = await createOrderWithItems(
    {
      customerName: input.customerName,
      phone: input.phone,
      street: input.street,
      city: input.city,
      postalCode: input.postalCode,
      deliveryCountryId: country.id,
      shippingPriceAtOrder: country.price,
      comment,
    },
    availableItems,
  );

  // Admin.telegramChatId nullable до тех пор, пока админ не напишет боту вручную (architecture.md
  // §3.4 п.5) — тот же принцип, что auth.service.requestPasswordReset: логировать и продолжать, не
  // падать. Сбой самого Telegram Bot API (уже настроенный chatId) — тот же try/catch, заказ уже
  // надёжно лежит в БД к этому моменту и не должен откатываться из-за недоступности Telegram.
  const chatId = await getAdminTelegramChatId();
  if (chatId) {
    try {
      await sendOrderNotification(chatId, {
        orderId,
        customerName: input.customerName,
        phone: input.phone,
        street: input.street,
        city: input.city,
        postalCode: input.postalCode,
        countryName: country.countryName,
        comment,
        items: availableItems,
        subtotal,
        shippingPrice: country.price,
        total,
      });
    } catch (error) {
      console.error('orders.service.createOrder: sendOrderNotification failed', error);
    }
  } else {
    console.error('orders.service.createOrder: Admin.telegramChatId is not set yet');
  }

  return { success: true, data: { id: orderId, unavailableCount } };
}

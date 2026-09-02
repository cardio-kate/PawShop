import { z } from 'zod';

// ТЗ §7.5 / architecture.md §3.2: индекс и телефон проверяются по формату, соответствующему стране
// доставки, не просто на непустоту. Компромисс, согласованный с пользователем перед стартом Фазы 4
// (.claude/plans/backend-realization-pawshop.md → «Блокеры до старта», п.2): один мягкий общий
// паттерн здесь — телефон в международном формате, индекс 3–10 буквенно-цифровых символов — покрывает
// все страны, включая уже сам по себе принимает Eircode-подобный ввод. Более строгая, специфичная для
// Ирландии проверка (действительно валидный Eircode, не просто "похоже на индекс") зависит от
// РЕАЛЬНОГО DeliveryCountry.countryName из БД, которого эта схема не знает (deliveryCountryId — просто
// число) — тот же принцип, что и «хотя бы один активный вариант» в products.service.ts (CLAUDE.md →
// «Формы»: схема отвечает за формат поля, не за кросс-полевые бизнес-инварианты, зависящие от БД).
// EIRCODE_PATTERN экспортируется отдельно и применяется в orders.service.ts уже после того, как
// пришёл настоящий countryName.

const PHONE_PATTERN = /^\+?[0-9\s\-()]{6,20}$/;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9\s-]{3,10}$/;

// Eircode: 3 буквенно-цифровых символа (routing key) + опциональный пробел + 4 буквенно-цифровых
// (unique identifier), например "D02 AF30".
export const EIRCODE_PATTERN = /^[A-Za-z0-9]{3}\s?[A-Za-z0-9]{4}$/i;

// message — ключ перевода ('Checkout.errors.…'), не готовая строка на английском (CLAUDE.md →
// «Мультиязычность»: витринные схемы переводятся наравне с остальной витриной, в отличие от
// admin-схем вроде product.schema.ts/auth.schema.ts). Перевод — useTranslations('Checkout') в
// CheckoutClient через setError(field, { message: t(errors.field) }).

const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  // Верхняя граница — защита от переполнения lib/money.ts (toCents(price) * quantity как обычное
  // число JS) при откровенно нереалистичном значении из прямого вызова action в обход UI, не бизнес-
  // лимит "на одного покупателя" — сам магазин ничего не удерживает клиента от повторного заказа.
  quantity: z.number().int().positive().max(999),
});

// Ключи относительно namespace 'Checkout' (useTranslations('Checkout') в CheckoutClient), не
// абсолютный путь 'Checkout.errors...' — так же, как в примере CLAUDE.md ('errors.email.invalid').
export const orderSchema = z.object({
  customerName: z.string().min(1, { error: 'errors.fullName.required' }),
  phone: z.string().regex(PHONE_PATTERN, { error: 'errors.phone.invalid' }),
  street: z.string().min(1, { error: 'errors.street.required' }),
  city: z.string().min(1, { error: 'errors.city.required' }),
  postalCode: z.string().regex(POSTAL_CODE_PATTERN, { error: 'errors.postalCode.invalid' }),
  deliveryCountryId: z.number().int().positive({ error: 'errors.country.required' }),
  // Пустая строка из Textarea — «нет комментария», не отдельная бизнес-ошибка; nullable() не нужен
  // здесь (в отличие от product.schema.ts, где nullable — уже сохранённое в БД значение) — orders.
  // service.ts сам сворачивает '' в null перед вставкой (schema работает с form-значением, не с
  // DB-представлением).
  comment: z.string().optional(),
  // Требование ЕС-витрины (продажи в ЕС, ТЗ §39/§7.9) — подтверждение, что клиент ознакомился с
  // Privacy Policy перед отправкой заказа. Не персистится в Order: правовое основание обработки этих
  // данных — исполнение договора (GDPR ст. 6(1)(b)), не согласие (6(1)(a)), поэтому доказательство
  // согласия не требуется — .refine() только блокирует сабмит без отметки, ничего не хранит. Тип
  // остаётся boolean (не z.literal(true)) специально: RHF-чекбоксу нужен boolean defaultValue (false)
  // до первого сабмита — литерал true как input-тип конфликтовал бы с этим на уровне TypeScript.
  agreesToPrivacyPolicy: z
    .boolean()
    .refine((value) => value === true, { error: 'errors.agreesToPrivacyPolicy.required' }),
  // Снапшот корзины на момент сабмита (lib/store/cart.store.ts), не поле формы — CheckoutClient
  // подставляет его при вызове, не через register()/зарегистрированный input. Сервер всё равно
  // перепроверяет цену/доступность каждой позиции по БД (CLAUDE.md → «Заказ и корзина»), эта схема
  // проверяет только форму данных, не их актуальность.
  items: z.array(orderItemSchema).min(1, { error: 'errors.items.empty' }),
});

export type OrderInput = z.infer<typeof orderSchema>;

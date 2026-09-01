import { z } from 'zod';

// product-spec.md §11 / CLAUDE.md → «Осознанно НЕ реализуется»: создание/удаление стран доставки из
// UI нет вообще — единственная админская мутация здесь правит price/estimatedDays/isActive у уже
// существующей строки, поэтому схема ровно под updateDeliveryCountry, без create-варианта.
// Admin-форма — ошибки на английском без ключей перевода, тот же принцип, что product.schema.ts.

const priceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { error: 'Price must be a valid amount (e.g. 4.90)' });

export const deliveryCountryUpdateSchema = z.object({
  price: priceSchema,
  estimatedDays: z.string().min(1, { error: 'Estimated days is required' }),
  isActive: z.boolean(),
});

export type DeliveryCountryUpdateInput = z.infer<typeof deliveryCountryUpdateSchema>;

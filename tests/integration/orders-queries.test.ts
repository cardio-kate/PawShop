import { eq } from 'drizzle-orm';
import { resetDb, getTestDb } from '@/tests/helpers/reset-db';
import { buildProduct, buildProductVariant, buildDeliveryCountry } from '@/tests/helpers/factories';
import { createOrderWithItems, getOrder } from '@/lib/db/queries/orders.queries';
import * as schema from '@/lib/db/schema';

// docs/architecture.md §4/§7: FK Order.deliveryCountryId / OrderItem.productId/variantId —
// onDelete:'set null' + nullable; история заказа держится в snapshot-полях (priceAtOrder,
// productNameAtOrder, variantLabelAtOrder, shippingPriceAtOrder), не пересчитывается задним числом
// по текущим ценам/названиям, даже когда исходная строка исчезает совсем (не только деактивируется).

beforeEach(async () => {
  await resetDb();
});

describe('orders.queries — snapshot fields survive soft-delete/hard-delete of their source rows', () => {
  it('keeps priceAtOrder/productNameAtOrder/variantLabelAtOrder unchanged after the product is soft-deleted and its price changes', async () => {
    const product = await buildProduct({ nameEn: 'Original Name' });
    const variant = await buildProductVariant(product.id, { label: 'Original Label', price: '10.00' });
    const country = await buildDeliveryCountry({ price: '5.00' });

    const orderId = await createOrderWithItems(
      {
        customerName: 'Jane Doe',
        phone: '+491234567',
        street: 'Main St 1',
        city: 'Berlin',
        postalCode: '10115',
        deliveryCountryId: country.id,
        shippingPriceAtOrder: country.price,
        comment: null,
      },
      [
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 2,
          priceAtOrder: variant.price,
          productNameAtOrder: product.nameEn,
          variantLabelAtOrder: variant.label,
        },
      ],
    );

    // Товар деактивирован и переименован/переоценён ПОСЛЕ того, как заказ уже создан — снапшот не
    // должен "догонять" текущее состояние.
    await getTestDb()
      .update(schema.product)
      .set({ isActive: false, nameEn: 'Renamed Later' })
      .where(eq(schema.product.id, product.id));
    await getTestDb()
      .update(schema.productVariant)
      .set({ price: '999.00', label: 'Renamed Variant' })
      .where(eq(schema.productVariant.id, variant.id));

    const order = await getOrder(orderId);

    expect(order!.items).toHaveLength(1);
    expect(order!.items[0]!.priceAtOrder).toBe('10.00');
    expect(order!.items[0]!.productNameAtOrder).toBe('Original Name');
    expect(order!.items[0]!.variantLabelAtOrder).toBe('Original Label');
  });

  it('nulls out productId/variantId but keeps the snapshot text when the product row is hard-deleted', async () => {
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id);
    const country = await buildDeliveryCountry();

    const orderId = await createOrderWithItems(
      {
        customerName: 'Jane Doe',
        phone: '+491234567',
        street: 'Main St 1',
        city: 'Berlin',
        postalCode: '10115',
        deliveryCountryId: country.id,
        shippingPriceAtOrder: country.price,
        comment: null,
      },
      [
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          priceAtOrder: variant.price,
          productNameAtOrder: product.nameEn,
          variantLabelAtOrder: variant.label,
        },
      ],
    );

    // Вариант удаляется первым — FK product_variants -> products не мешает удалить сам товар следом.
    await getTestDb().delete(schema.productVariant).where(eq(schema.productVariant.id, variant.id));
    await getTestDb().delete(schema.product).where(eq(schema.product.id, product.id));

    const order = await getOrder(orderId);

    expect(order!.items[0]!.productId).toBeNull();
    expect(order!.items[0]!.variantId).toBeNull();
    expect(order!.items[0]!.productNameAtOrder).toBe(product.nameEn);
    expect(order!.items[0]!.variantLabelAtOrder).toBe(variant.label);
  });

  it('keeps shippingPriceAtOrder unchanged and nulls deliveryCountryId/countryName after the country is hard-deleted', async () => {
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id);
    const country = await buildDeliveryCountry({ countryName: 'Vanishing Land', price: '7.50' });

    const orderId = await createOrderWithItems(
      {
        customerName: 'Jane Doe',
        phone: '+491234567',
        street: 'Main St 1',
        city: 'Berlin',
        postalCode: '10115',
        deliveryCountryId: country.id,
        shippingPriceAtOrder: country.price,
        comment: null,
      },
      [
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          priceAtOrder: variant.price,
          productNameAtOrder: product.nameEn,
          variantLabelAtOrder: variant.label,
        },
      ],
    );

    await getTestDb().delete(schema.deliveryCountry).where(eq(schema.deliveryCountry.id, country.id));

    const order = await getOrder(orderId);

    expect(order!.deliveryCountryId).toBeNull();
    expect(order!.countryName).toBeNull();
    expect(order!.shippingPriceAtOrder).toBe('7.50');
  });
});

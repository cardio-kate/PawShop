import { resetDb } from '@/tests/helpers/reset-db';
import { buildDeliveryCountry } from '@/tests/helpers/factories';
import { getDeliveryCountries, getAdminDeliveryCountries } from '@/lib/db/queries/delivery.queries';

// docs/architecture.md §7: getDeliveryCountries/getAdminDeliveryCountries — та же isActive-граница
// public/admin, что products.queries.getProducts/getAdminProducts.

beforeEach(async () => {
  await resetDb();
});

describe('delivery.queries — public vs admin isActive scope', () => {
  it('getDeliveryCountries (public) returns only isActive:true countries', async () => {
    const active = await buildDeliveryCountry({ countryName: 'Germany', isActive: true });
    await buildDeliveryCountry({ countryName: 'Disabled Land', isActive: false });

    const countries = await getDeliveryCountries();

    expect(countries.map((c) => c.id)).toEqual([active.id]);
  });

  it('getAdminDeliveryCountries returns both active and inactive countries', async () => {
    const active = await buildDeliveryCountry({ countryName: 'Germany', isActive: true });
    const inactive = await buildDeliveryCountry({ countryName: 'Disabled Land', isActive: false });

    const countries = await getAdminDeliveryCountries();

    expect(countries.map((c) => c.id).sort()).toEqual([active.id, inactive.id].sort());
  });

  it('both orderings are alphabetical by countryName, not insertion order', async () => {
    await buildDeliveryCountry({ countryName: 'Zealandia' });
    await buildDeliveryCountry({ countryName: 'Austria' });

    const countries = await getDeliveryCountries();

    expect(countries.map((c) => c.countryName)).toEqual(['Austria', 'Zealandia']);
  });
});

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { MOCK_DELIVERY_COUNTRIES } from '@/components/product/mock-data';
import { adminTableRowClassName } from '@/components/admin/constants';
import type { MockDeliveryCountry } from '@/types';

const CELL_CLASSNAME = 'px-sm py-xs';

// tz-pawshop.md §7.8/§11: единственная правка, доступная админу, — price/estimatedDays/isActive
// уже существующей страны (updateDeliveryCountry); создания/удаления стран из UI нет (см. §11 —
// набор стран заводится только scripts/seed-delivery-countries.ts). Поэтому здесь, в отличие от
// ProductTable, нет ни кнопки добавления строки, ни удаления — только инлайн-редактирование, тот
// же язык ячеек-с-инпутами, что у VariantEditor (CELL_CLASSNAME 'px-sm py-xs', не
// ADMIN_TABLE_CELL_CLASSNAME — см. комментарий в constants.ts). Country — обычный текст, не Input:
// имя страны не редактируется.
export function DeliveryTable() {
  const [countries, setCountries] = useState<MockDeliveryCountry[]>(MOCK_DELIVERY_COUNTRIES);

  function updateCountry(id: string, patch: Partial<MockDeliveryCountry>) {
    setCountries((current) =>
      current.map((country) => (country.id === id ? { ...country, ...patch } : country)),
    );
  }

  return (
    <>
      {/* < sm: таблица (min-w-[520px]) не помещается даже на широких телефонах (390px) без
          горизонтального скролла внутри узкого overflow-x-auto-блока — по прямому запросу заменена
          карточками, а не оставлена на горизонтальный скролл, как остальные admin-таблицы. ≥ sm —
          обычная таблица, тот же брейкпоинт, на котором AdminSidebar переключается с мобильной
          верхней панели на боковую колонку. */}
      <div className="gap-sm flex flex-col sm:hidden">
        {countries.map((country) => (
          <div
            key={country.id}
            className="gap-sm rounded-md border border-neutral-300 p-md flex flex-col"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md text-neutral-900">{country.countryName}</span>
              <Toggle
                checked={country.isActive}
                onChange={(checked) => updateCountry(country.id, { isActive: checked })}
                aria-label={`${country.isActive ? 'Deactivate' : 'Activate'} ${country.countryName}`}
              />
            </div>
            <div className="gap-sm grid grid-cols-2">
              <label className="gap-xs flex flex-col">
                <span className="text-body-sm text-neutral-500">Price</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={country.price}
                  onChange={(e) => updateCountry(country.id, { price: Number(e.target.value) })}
                  aria-label={`${country.countryName} price`}
                />
              </label>
              <label className="gap-xs flex flex-col">
                <span className="text-body-sm text-neutral-500">Estimated days</span>
                <Input
                  value={country.estimatedDays}
                  onChange={(e) => updateCountry(country.id, { estimatedDays: e.target.value })}
                  placeholder="e.g. 2–4"
                  aria-label={`${country.countryName} estimated delivery days`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300">
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Country
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Price
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Estimated days
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Active
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country, index) => (
              <tr key={country.id} className={adminTableRowClassName(index)}>
                <td className={CELL_CLASSNAME}>
                  <span className="text-body-sm text-neutral-900">{country.countryName}</span>
                </td>
                <td className={CELL_CLASSNAME}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={country.price}
                    onChange={(e) => updateCountry(country.id, { price: Number(e.target.value) })}
                    aria-label={`${country.countryName} price`}
                    className="w-24"
                  />
                </td>
                <td className={CELL_CLASSNAME}>
                  <Input
                    value={country.estimatedDays}
                    onChange={(e) => updateCountry(country.id, { estimatedDays: e.target.value })}
                    placeholder="e.g. 2–4"
                    aria-label={`${country.countryName} estimated delivery days`}
                    className="w-24"
                  />
                </td>
                <td className={CELL_CLASSNAME}>
                  <Toggle
                    checked={country.isActive}
                    onChange={(checked) => updateCountry(country.id, { isActive: checked })}
                    aria-label={`${country.isActive ? 'Deactivate' : 'Activate'} ${country.countryName}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

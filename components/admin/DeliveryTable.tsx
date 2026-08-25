'use client';

import { Fragment, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { updateDeliveryCountry } from '@/actions/delivery.actions';
import { adminTableRowClassName } from '@/components/admin/constants';
import type { DeliveryCountryRow } from '@/lib/db/queries/delivery.queries';

const CELL_CLASSNAME = 'px-sm py-xs';

interface DeliveryTableProps {
  countries: DeliveryCountryRow[];
}

// tz-pawshop.md §7.8/§11: единственная правка, доступная админу, — price/estimatedDays/isActive
// уже существующей страны (updateDeliveryCountry); создания/удаления стран из UI нет (см. §11 —
// набор стран заводится только scripts/seed-delivery-countries.ts). Поэтому здесь, в отличие от
// ProductTable, нет ни кнопки добавления строки, ни удаления — только инлайн-редактирование, тот
// же язык ячеек-с-инпутами, что у VariantEditor (CELL_CLASSNAME 'px-sm py-xs', не
// ADMIN_TABLE_CELL_CLASSNAME — см. комментарий в constants.ts). Country — обычный текст, не Input:
// имя страны не редактируется.
//
// [REV2] Фаза 3: реально подключено к updateDeliveryCountry — каждое поле уходит на сервер само
// (price/estimatedDays на blur, Active — сразу по клику), а не копится молча в памяти компонента.
// committed — последнее подтверждённое сервером состояние каждой страны, используется для отката
// конкретной строки при ошибке ответа; countries — то, что видно на экране (включает недосохранённый
// ввод между keystroke'ами и blur).
export function DeliveryTable({ countries: initialCountries }: DeliveryTableProps) {
  const [countries, setCountries] = useState<DeliveryCountryRow[]>(initialCountries);
  const [committed, setCommitted] = useState<Map<number, DeliveryCountryRow>>(
    () => new Map(initialCountries.map((country) => [country.id, country])),
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  function updateLocal(id: number, patch: Partial<DeliveryCountryRow>) {
    setCountries((current) =>
      current.map((country) => (country.id === id ? { ...country, ...patch } : country)),
    );
  }

  async function save(
    id: number,
    fields: Pick<DeliveryCountryRow, 'price' | 'estimatedDays' | 'isActive'>,
  ) {
    const result = await updateDeliveryCountry(id, fields);

    if (result.success) {
      const previous = committed.get(id);
      if (previous) {
        setCommitted((current) => new Map(current).set(id, { ...previous, ...fields }));
      }
      setErrors((current) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: removed, ...rest } = current;
        return rest;
      });
    } else {
      const rollback = committed.get(id);
      if (rollback) updateLocal(id, rollback);
      setErrors((current) => ({
        ...current,
        [id]: Object.values(result.errors)[0] ?? 'Failed to save. Please try again.',
      }));
    }
  }

  function handleToggle(country: DeliveryCountryRow, checked: boolean) {
    updateLocal(country.id, { isActive: checked });
    void save(country.id, {
      price: country.price,
      estimatedDays: country.estimatedDays,
      isActive: checked,
    });
  }

  function handlePriceBlur(country: DeliveryCountryRow) {
    const current = committed.get(country.id);
    if (current?.price === country.price) return; // не звать сервер, если ничего не поменялось
    void save(country.id, {
      price: country.price,
      estimatedDays: country.estimatedDays,
      isActive: country.isActive,
    });
  }

  function handleEstimatedDaysBlur(country: DeliveryCountryRow) {
    const current = committed.get(country.id);
    if (current?.estimatedDays === country.estimatedDays) return;
    void save(country.id, {
      price: country.price,
      estimatedDays: country.estimatedDays,
      isActive: country.isActive,
    });
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
                onChange={(checked) => handleToggle(country, checked)}
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
                  onChange={(e) => updateLocal(country.id, { price: e.target.value })}
                  onBlur={() => handlePriceBlur(country)}
                  aria-label={`${country.countryName} price`}
                />
              </label>
              <label className="gap-xs flex flex-col">
                <span className="text-body-sm text-neutral-500">Estimated days</span>
                <Input
                  value={country.estimatedDays}
                  onChange={(e) => updateLocal(country.id, { estimatedDays: e.target.value })}
                  onBlur={() => handleEstimatedDaysBlur(country)}
                  placeholder="e.g. 2–4"
                  aria-label={`${country.countryName} estimated delivery days`}
                />
              </label>
            </div>
            {errors[country.id] && (
              <span role="alert" className="text-body-sm text-error">
                {errors[country.id]}
              </span>
            )}
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
              <Fragment key={country.id}>
                <tr className={adminTableRowClassName(index)}>
                  <td className={CELL_CLASSNAME}>
                    <span className="text-body-sm text-neutral-900">{country.countryName}</span>
                  </td>
                  <td className={CELL_CLASSNAME}>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={country.price}
                      onChange={(e) => updateLocal(country.id, { price: e.target.value })}
                      onBlur={() => handlePriceBlur(country)}
                      aria-label={`${country.countryName} price`}
                      className="w-24"
                    />
                  </td>
                  <td className={CELL_CLASSNAME}>
                    <Input
                      value={country.estimatedDays}
                      onChange={(e) => updateLocal(country.id, { estimatedDays: e.target.value })}
                      onBlur={() => handleEstimatedDaysBlur(country)}
                      placeholder="e.g. 2–4"
                      aria-label={`${country.countryName} estimated delivery days`}
                      className="w-24"
                    />
                  </td>
                  <td className={CELL_CLASSNAME}>
                    <Toggle
                      checked={country.isActive}
                      onChange={(checked) => handleToggle(country, checked)}
                      aria-label={`${country.isActive ? 'Deactivate' : 'Activate'} ${country.countryName}`}
                    />
                  </td>
                </tr>
                {errors[country.id] && (
                  <tr className="border-b border-neutral-300">
                    <td colSpan={4} className={`${CELL_CLASSNAME} pt-0`}>
                      <span role="alert" className="text-body-sm text-error">
                        {errors[country.id]}
                      </span>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

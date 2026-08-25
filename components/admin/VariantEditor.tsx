'use client';

import {
  useController,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { PRODUCT_MIN_ITEMS, adminTableRowClassName } from '@/components/admin/constants';
import { iconActionButtonClassName } from '@/components/ui/interaction-styles';
import type { ProductInput } from '@/lib/validation/product.schema';

interface VariantEditorProps {
  control: Control<ProductInput>;
  register: UseFormRegister<ProductInput>;
  errors: FieldErrors<ProductInput>;
}

const CELL_CLASSNAME = 'px-sm py-xs';

// design.md → ProductForm «Редактор вариантов»: admin table-стиль (table-row-even/odd,
// table-border), тот же язык, что у ProductTable/OrderTable. Кнопка удаления скрыта у последнего
// оставшегося варианта — товар обязан иметь минимум один (§4 ТЗ), правило видно уже в форме.
//
// useFieldArray вместо controlled variants[]/onChange (как раньше на моках) — ProductForm владеет
// состоянием всей формы через react-hook-form, этот компонент только регистрирует поля в общий
// control, не держит собственную копию variants (architecture.md §3.11).
export function VariantEditor({ control, register, errors }: VariantEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  function addVariant() {
    append({ label: '', price: '', isActive: true });
  }

  return (
    <div className="gap-sm flex flex-col">
      <span className="text-label-md text-neutral-900">Variants</span>

      {/* < sm: ProductForm сам ограничен max-w-[560px], а на телефоне доступная ширина ещё меньше
          (минус p-lg страницы-обёртки) — 4-колоночная таблица (min-w-[420px]) там же скроллилась
          бы вбок, как и остальные admin-таблицы. По прямому запросу — карточка на вариант вместо
          горизонтального скролла, тот же приём и брейкпоинт, что у ProductTable/OrderTable/
          DeliveryTable. ≥ sm — обычная таблица без изменений. */}
      <div className="gap-sm flex flex-col sm:hidden">
        {fields.map((field, index) => {
          const variantErrors = errors.variants?.[index];
          return (
            <div
              key={field.id}
              className="gap-sm rounded-md border border-neutral-300 p-sm flex flex-col"
            >
              <Input
                {...register(`variants.${index}.label`)}
                placeholder="e.g. 300 g"
                aria-label={`Variant ${index + 1} label`}
                error={!!variantErrors?.label}
                aria-describedby={variantErrors?.label ? `variant-${index}-label-error` : undefined}
              />
              {variantErrors?.label && (
                <span
                  id={`variant-${index}-label-error`}
                  role="alert"
                  className="text-body-sm text-error"
                >
                  {variantErrors.label.message}
                </span>
              )}
              <div className="flex items-center justify-between">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`variants.${index}.price`)}
                  aria-label={`Variant ${index + 1} price`}
                  error={!!variantErrors?.price}
                  aria-describedby={variantErrors?.price ? `variant-${index}-price-error` : undefined}
                  className="w-24"
                />
                <div className="gap-sm flex items-center">
                  <VariantActiveToggle control={control} index={index} />
                  {fields.length > PRODUCT_MIN_ITEMS && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove variant ${index + 1}`}
                      className={iconActionButtonClassName('danger')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              {variantErrors?.price && (
                <span
                  id={`variant-${index}-price-error`}
                  role="alert"
                  className="text-body-sm text-error"
                >
                  {variantErrors.price.message}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300">
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Label
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Price
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md text-neutral-900`}>
                Active
              </th>
              <th scope="col" className="px-sm py-xs">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const variantErrors = errors.variants?.[index];
              return (
                <tr key={field.id} className={adminTableRowClassName(index)}>
                  <td className={CELL_CLASSNAME}>
                    <Input
                      {...register(`variants.${index}.label`)}
                      placeholder="e.g. 300 g"
                      aria-label={`Variant ${index + 1} label`}
                      error={!!variantErrors?.label}
                      aria-describedby={
                        variantErrors?.label ? `variant-${index}-label-error-table` : undefined
                      }
                      className="min-w-[140px]"
                    />
                    {variantErrors?.label && (
                      <span
                        id={`variant-${index}-label-error-table`}
                        role="alert"
                        className="text-body-sm text-error block"
                      >
                        {variantErrors.label.message}
                      </span>
                    )}
                  </td>
                  <td className={CELL_CLASSNAME}>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`variants.${index}.price`)}
                      aria-label={`Variant ${index + 1} price`}
                      error={!!variantErrors?.price}
                      aria-describedby={
                        variantErrors?.price ? `variant-${index}-price-error-table` : undefined
                      }
                      className="w-24"
                    />
                    {variantErrors?.price && (
                      <span
                        id={`variant-${index}-price-error-table`}
                        role="alert"
                        className="text-body-sm text-error block"
                      >
                        {variantErrors.price.message}
                      </span>
                    )}
                  </td>
                  <td className={CELL_CLASSNAME}>
                    <VariantActiveToggle control={control} index={index} />
                  </td>
                  <td className="px-sm py-xs">
                    {fields.length > PRODUCT_MIN_ITEMS && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Remove variant ${index + 1}`}
                        className={iconActionButtonClassName('danger')}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addVariant}
        className="self-start"
      >
        + Add variant
      </Button>
    </div>
  );
}

// Toggle — контролируемая кнопка (checked/onChange(boolean)), не нативный input: register()
// собирает {name,onChange(event),onBlur,ref} под нативный change-event, сюда не подходит. Отдельный
// маленький компонент вместо Controller-JSX прямо в двух местах таблицы (mobile-карточка и
// desktop-строка используют один и тот же variants.${index}.isActive) — так имя поля не дублируется
// в двух местах текстом.
function VariantActiveToggle({ control, index }: { control: Control<ProductInput>; index: number }) {
  const { field } = useController({ control, name: `variants.${index}.isActive` });
  return (
    <Toggle
      checked={field.value}
      onChange={field.onChange}
      aria-label={field.value ? `Deactivate variant ${index + 1}` : `Activate variant ${index + 1}`}
    />
  );
}

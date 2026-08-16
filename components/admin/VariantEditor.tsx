'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import type { MockVariant } from '@/types';

interface VariantEditorProps {
  variants: MockVariant[];
  onChange: (variants: MockVariant[]) => void;
}

let idCounter = 0;
function nextVariantId(): string {
  idCounter += 1;
  return `new-variant-${idCounter}`;
}

const CELL_CLASSNAME = 'px-sm py-xs';

// design.md → ProductForm «Редактор вариантов»: admin table-стиль (table-row-even/odd,
// table-border), тот же язык, что у ProductTable/OrderTable. Кнопка удаления скрыта у последнего
// оставшегося варианта — товар обязан иметь минимум один (§4 ТЗ), правило видно уже в форме.
export function VariantEditor({ variants, onChange }: VariantEditorProps) {
  function updateVariant(id: string, patch: Partial<MockVariant>) {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  }

  function removeVariant(id: string) {
    onChange(variants.filter((variant) => variant.id !== id));
  }

  function addVariant() {
    onChange([...variants, { id: nextVariantId(), label: '', price: 0, isActive: true }]);
  }

  return (
    <div className="flex flex-col gap-sm">
      <span className="text-label-md text-neutral-900">Variants</span>
      <div className="overflow-x-auto rounded-md border border-neutral-300">
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
            {variants.map((variant, index) => (
              <tr
                key={variant.id}
                className={`border-b border-neutral-300 last:border-b-0 ${index % 2 === 0 ? 'bg-neutral-100' : 'bg-surface'}`}
              >
                <td className={CELL_CLASSNAME}>
                  <Input
                    value={variant.label}
                    onChange={(e) => updateVariant(variant.id, { label: e.target.value })}
                    placeholder="e.g. 300 g"
                    aria-label="Variant label"
                    className="min-w-[140px]"
                  />
                </td>
                <td className={CELL_CLASSNAME}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, { price: Number(e.target.value) })}
                    aria-label="Variant price"
                    className="w-24"
                  />
                </td>
                <td className={CELL_CLASSNAME}>
                  <Toggle
                    checked={variant.isActive}
                    onChange={(checked) => updateVariant(variant.id, { isActive: checked })}
                    aria-label={`${variant.isActive ? 'Deactivate' : 'Activate'} variant ${variant.label || index + 1}`}
                  />
                </td>
                <td className="px-sm py-xs">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={`Remove variant ${variant.label || index + 1}`}
                      className="cursor-pointer rounded-full p-1 text-neutral-700 transition-colors duration-fast hover:text-error motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={addVariant} className="self-start">
        + Add variant
      </Button>
    </div>
  );
}

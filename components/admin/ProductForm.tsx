'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { VariantEditor } from '@/components/admin/VariantEditor';
import { PRODUCT_MIN_ITEMS } from '@/components/admin/constants';
import { createProduct, updateProduct } from '@/actions/products.actions';
import { productSchema, type ProductInput } from '@/lib/validation/product.schema';
import type { ProductDetail } from '@/lib/db/queries/products.queries';
import type { AgeGroup } from '@/types';

const AGE_GROUPS: AgeGroup[] = ['kitten', 'adult', 'senior'];
const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  kitten: 'Kitten',
  adult: 'Adult',
  senior: 'Senior',
};

// Admin-форма без i18n-ключей, тот же принцип, что у StaffLoginCard (CLAUDE.md → «Что не
// локализуется»).
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

interface ProductFormCategory {
  id: number;
  nameEn: string;
}

interface ProductFormProps {
  product?: ProductDetail;
  categories: ProductFormCategory[];
}

// Textarea/Input не умеют отображать value={null} (нативный контрол ждёт строку) — null из БД
// превращается в '' для показа в поле, а на обратном пути register(..., { setValueAs }) ниже
// сворачивает '' обратно в null перед тем, как значение попадёт в Zod/action (accessories и
// подобные товары без состава хранят именно null, не пустую строку — CLAUDE.md → «Мультиязычность»,
// тот же nullable-инвариант, что у nameDe/descriptionDe).
function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

function toDefaultValues(product: ProductDetail | undefined, categories: ProductFormCategory[]): ProductInput {
  if (product) {
    return {
      categoryId: product.categoryId,
      nameEn: product.nameEn,
      nameDe: product.nameDe,
      descriptionEn: product.descriptionEn,
      descriptionDe: product.descriptionDe,
      composition: product.composition ?? '',
      analyticalConstituents: product.analyticalConstituents ?? '',
      flavor: product.flavor ?? '',
      ageGroup: product.ageGroup,
      images: product.images,
      isNew: product.isNew,
      isActive: product.isActive,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: variant.price,
        isActive: variant.isActive,
      })),
    };
  }

  return {
    categoryId: categories[0]?.id ?? 0,
    nameEn: '',
    nameDe: null,
    descriptionEn: '',
    descriptionDe: null,
    composition: '',
    analyticalConstituents: '',
    flavor: '',
    ageGroup: 'kitten',
    images: [],
    isNew: false,
    isActive: true,
    variants: [{ label: '', price: '', isActive: true }],
  };
}

// design.md → ProductForm (§10 ТЗ): одна колонка, поля сверху вниз, Save/Cancel на всю ширину
// внизу — вёрстка не менялась при переподключении, только источник данных (моки → createProduct/
// updateProduct) и способ отправки (react-hook-form + zodResolver вместо useState, architecture.md
// §3.11). nameDe/descriptionDe тут нет полей намеренно — admin всегда английский, перевод не задача
// этой формы (CLAUDE.md → «Мультиязычность»); при правке существующего товара их текущее значение
// сохраняется через defaultValues и уходит обратно как есть, не теряется.
export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: toDefaultValues(product, categories),
  });

  const images = watch('images');
  const variants = watch('variants');
  // Та же клиентская подсказка "нельзя сохранить", что была на моках — не дублирует Zod (schema
  // тоже проверяет .min(1) на submit), а даёт мгновенную обратную связь без круговой поездки на
  // сервер (architecture.md §3.11: клиентская валидация — ускорение UX, не замена серверной).
  const canSave = images.length >= PRODUCT_MIN_ITEMS && variants.length >= PRODUCT_MIN_ITEMS;

  async function onSubmit(data: ProductInput) {
    try {
      const result = product ? await updateProduct(product.id, data) : await createProduct(data);
      if (!result.success) {
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof ProductInput, { message });
        }
        return;
      }
      router.push('/nine-lives/dashboard/products');
    } catch {
      setError('root', { message: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="gap-lg bg-surface p-lg flex max-w-[560px] flex-col rounded-lg"
    >
      {errors.root && (
        <p
          role="alert"
          className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
        >
          {errors.root.message}
        </p>
      )}

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Name</span>
        <Input
          {...register('nameEn')}
          error={!!errors.nameEn}
          aria-describedby={errors.nameEn ? 'name-error' : undefined}
        />
        {errors.nameEn && (
          <span id="name-error" role="alert" className="text-body-sm text-error">
            {errors.nameEn.message}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Category</span>
        <Select
          {...register('categoryId', { valueAsNumber: true })}
          error={!!errors.categoryId}
          aria-describedby={errors.categoryId ? 'category-error' : undefined}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameEn}
            </option>
          ))}
        </Select>
        {errors.categoryId && (
          <span id="category-error" role="alert" className="text-body-sm text-error">
            {errors.categoryId.message}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Age group</span>
        <Select
          {...register('ageGroup')}
          error={!!errors.ageGroup}
          aria-describedby={errors.ageGroup ? 'age-group-error' : undefined}
        >
          {AGE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {AGE_GROUP_LABEL[group]}
            </option>
          ))}
        </Select>
        {errors.ageGroup && (
          <span id="age-group-error" role="alert" className="text-body-sm text-error">
            {errors.ageGroup.message}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Description</span>
        <Textarea
          {...register('descriptionEn')}
          rows={4}
          error={!!errors.descriptionEn}
          aria-describedby={errors.descriptionEn ? 'description-error' : undefined}
        />
        {errors.descriptionEn && (
          <span id="description-error" role="alert" className="text-body-sm text-error">
            {errors.descriptionEn.message}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Flavor</span>
        <Input {...register('flavor', { setValueAs: emptyToNull })} placeholder="e.g. Chicken" />
      </label>

      {/* Composition/Analytical constituents — обязательные секции этикетки корма ЕС (schema.ts).
          Nullable, не .min(1) — товары не-корм (accessories) их не заполняют вовсе. */}
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Composition</span>
        <Textarea
          {...register('composition', { setValueAs: emptyToNull })}
          rows={3}
          placeholder="e.g. Chicken (32%), rice, fish oil, vitamins A, D3, E."
        />
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Analytical constituents</span>
        <Textarea
          {...register('analyticalConstituents', { setValueAs: emptyToNull })}
          rows={2}
          placeholder="e.g. Protein 32%, Fat 15%, Fibre 2%, Ash 7%, Moisture 8%."
        />
      </label>

      <Controller
        control={control}
        name="images"
        render={({ field }) => <ImageUploader images={field.value} onChange={field.onChange} />}
      />
      {errors.images && (
        <span role="alert" className="text-body-sm text-error">
          {errors.images.message}
        </span>
      )}

      <VariantEditor control={control} register={register} errors={errors} />
      {errors.variants?.root && (
        <span role="alert" className="text-body-sm text-error">
          {errors.variants.root.message}
        </span>
      )}

      <label className="gap-md flex items-center justify-between">
        <span className="text-label-md text-neutral-900">Active</span>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Toggle checked={field.value} onChange={field.onChange} aria-label="Active" />
          )}
        />
      </label>

      <label className="gap-md flex items-center justify-between">
        <span className="text-label-md text-neutral-900">New arrival</span>
        <Controller
          control={control}
          name="isNew"
          render={({ field }) => (
            <Toggle checked={field.value} onChange={field.onChange} aria-label="New arrival" />
          )}
        />
      </label>

      <div className="gap-sm flex flex-col">
        <Button
          type="submit"
          variant="primary"
          disabled={!canSave || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/nine-lives/dashboard/products')}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { VariantEditor } from '@/components/admin/VariantEditor';
import { MOCK_CATEGORIES } from '@/components/product/mock-data';
import type { AgeGroup, MockProduct, MockVariant } from '@/types';

const AGE_GROUPS: AgeGroup[] = ['kitten', 'adult', 'senior'];
const AGE_GROUP_LABEL: Record<AgeGroup, string> = { kitten: 'Kitten', adult: 'Adult', senior: 'Senior' };

interface ProductFormProps {
  product?: MockProduct;
}

// design.md → ProductForm (§10 ТЗ): одна колонка, поля сверху вниз, Save/Cancel на всю ширину
// внизу. createProduct/updateProduct не подключены (Фаза 7 — только UI на моках, см. план,
// «Что за пределами этого плана»): Save мокает успех тем же способом, что StaffLoginCard мокает
// сабмит — переходом в следующее состояние (здесь — редирект к списку), без реальной записи.
export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? MOCK_CATEGORIES[0]!.id);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(product?.ageGroup ?? 'kitten');
  const [description, setDescription] = useState(product?.description ?? '');
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  // Ленивый инициализатор — иначе crypto.randomUUID() (и любой другой побочный эффект внутри)
  // пересчитывался бы на каждый ре-рендер формы (каждую печатную клавишу в Name/Description),
  // а не только при монтировании.
  const [variants, setVariants] = useState<MockVariant[]>(
    () => product?.variants ?? [{ id: crypto.randomUUID(), label: '', price: 0, isActive: true }],
  );
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  // §10/architecture.md §3.1: товар без фото и без варианта сохранить нельзя — то же правило,
  // что и на сервере (products.service.ts, будущая фаза), видно уже здесь, а не только как ошибка
  // после попытки сохранить.
  const canSave = images.length > 0 && variants.length > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSave) return;
    router.push('/admin/dashboard/products');
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[560px] flex-col gap-lg rounded-lg bg-surface p-lg">
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Category</span>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {MOCK_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameEn}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Age group</span>
        <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}>
          {AGE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {AGE_GROUP_LABEL[group]}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 bg-surface px-md py-[12px] text-body-md text-neutral-900 outline-none transition-colors duration-fast focus:border-paw motion-reduce:transition-none"
        />
      </label>

      <ImageUploader images={images} onChange={setImages} />

      <VariantEditor variants={variants} onChange={setVariants} />

      <label className="flex items-center justify-between gap-md">
        <span className="text-label-md text-neutral-900">Active</span>
        <Toggle checked={isActive} onChange={setIsActive} aria-label="Active" />
      </label>

      <label className="flex items-center justify-between gap-md">
        <span className="text-label-md text-neutral-900">New arrival</span>
        <Toggle checked={isNew} onChange={setIsNew} aria-label="New arrival" />
      </label>

      <div className="flex flex-col gap-sm">
        <Button type="submit" variant="primary" disabled={!canSave} className="w-full">
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/dashboard/products')}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

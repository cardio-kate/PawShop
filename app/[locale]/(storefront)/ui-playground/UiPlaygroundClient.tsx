'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { ProductCard, type ProductCardProduct } from '@/components/product/ProductCard';

// Фикстуры для визуальной проверки — не MOCK_PRODUCTS (тот всё ещё в старой строковой id-форме,
// components/product/mock-data.ts): ProductCard теперь принимает реальную форму товара (числовые
// id, price/variant.price — numeric(10,2)-строки), playground использует ту же форму напрямую.
const PLAYGROUND_PRODUCTS: ProductCardProduct[] = [
  {
    id: 1,
    slug: 'kitten-chicken-pouches-in-jelly',
    name: 'Kitten chicken pouches in jelly',
    images: ['/mock/products/kitten-chicken-pouches-in-jelly.jpg'],
    isNew: true,
    price: '1.40',
    variants: [{ id: 1, label: '85 g', price: '1.40', isActive: true }],
  },
  {
    id: 2,
    slug: 'salmon-rice-kibble',
    name: 'Salmon & rice kibble',
    images: ['/mock/products/salmon-rice-kibble.jpg'],
    isNew: false,
    price: '3.90',
    variants: [{ id: 2, label: '300 g', price: '3.90', isActive: true }],
  },
  {
    id: 3,
    slug: 'turkey-indoor-kibble',
    name: 'Turkey indoor kibble',
    images: ['/mock/products/turkey-indoor-kibble.jpg'],
    isNew: false,
    price: '4.30',
    variants: [{ id: 3, label: '300 g', price: '4.30', isActive: false }],
  },
];

// Внутренний playground для визуальной проверки Фазы 1 (components/ui) — не бизнес-страница,
// удаляется или остаётся служебным маршрутом по решению из .claude/plans/velvety-kindling-planet.md.
// rowClassName — оверрайд дефолтного items-center gap-md: у Product card карточки должны тянуться
// на общую высоту ряда (items-stretch), иначе ProductCard.h-full не от чего считать, и добавочный
// gap-gutter (24px) вместо стандартного gap-md (16px) — плотнее смотрелось узко именно для карточек.
function Section({
  title,
  rowClassName,
  children,
}: {
  title: string;
  rowClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="gap-md py-lg flex flex-col border-b border-neutral-200">
      <h2 className="text-h3 text-neutral-900">{title}</h2>
      <div className={rowClassName ?? 'gap-md flex flex-wrap items-center'}>{children}</div>
    </section>
  );
}

export function UiPlaygroundClient() {
  const [filterSelected, setFilterSelected] = useState(false);
  const [variantSelected, setVariantSelected] = useState(true);
  const [toggleOn, setToggleOn] = useState(true);
  const [toggleOff, setToggleOff] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <div className="max-w-container px-lg py-3xl mx-auto">
      <h1 className="text-h1 text-neutral-900">UI playground — Фаза 1</h1>

      <Section title="Button">
        <Button variant="primary">Add to Cart</Button>
        <Button variant="secondary">View details</Button>
        <Button variant="primary" disabled>
          Place Order
        </Button>
        <Button variant="secondary" disabled>
          Continue shopping
        </Button>
      </Section>

      <Section title="Badge">
        <Badge variant="new">New</Badge>
        <Badge variant="out-of-stock">Out of stock</Badge>
        <Badge variant="order-new">New</Badge>
        <Badge variant="order-processing">Processing</Badge>
        <Badge variant="order-done">Done</Badge>
        <Badge variant="order-cancelled">Cancelled</Badge>
      </Section>

      <Section title="Chip — filter">
        <Chip kind="filter" selected={filterSelected} onClick={() => setFilterSelected((v) => !v)}>
          Dry food
        </Chip>
        <Chip kind="filter" disabled>
          Wet food
        </Chip>
      </Section>

      <Section title="Chip — variant">
        <Chip
          kind="variant"
          selected={variantSelected}
          onClick={() => setVariantSelected((v) => !v)}
        >
          400g
        </Chip>
        <Chip kind="variant" disabled>
          Out of stock
        </Chip>
      </Section>

      <Section title="Input">
        <Input placeholder="Default" className="w-56" />
        <Input placeholder="Error" error className="w-56" />
        <Input placeholder="Disabled" disabled className="w-56" />
      </Section>

      <Section title="Select">
        <Select defaultValue="" className="w-56">
          <option value="" disabled>
            Choose a country
          </option>
          <option value="germany">Germany</option>
          <option value="austria">Austria</option>
        </Select>
        <Select defaultValue="" error className="w-56">
          <option value="" disabled>
            Choose a country
          </option>
          <option value="germany">Germany</option>
        </Select>
        <Select defaultValue="germany" disabled className="w-56">
          <option value="germany">Germany</option>
        </Select>
      </Section>

      <Section title="Toggle">
        <Toggle checked={toggleOn} onChange={setToggleOn} aria-label="isNew (on)" />
        <Toggle checked={toggleOff} onChange={setToggleOff} aria-label="isNew (off)" />
        <Toggle checked disabled onChange={() => {}} aria-label="isNew (disabled)" />
      </Section>

      <Section title="Panel">
        <Button variant="primary" onClick={() => setIsCartOpen(true)}>
          Open cart panel
        </Button>
        <Button variant="secondary" onClick={() => setIsAdminModalOpen(true)}>
          Open admin modal
        </Button>
      </Section>

      <Section title="Product card" rowClassName="flex flex-wrap items-stretch gap-gutter">
        {PLAYGROUND_PRODUCTS.map((product) => (
          <div key={product.id} className="w-64">
            <ProductCard
              product={product}
              locale="en"
              newLabel="New"
              addToCartLabel={`Add ${product.name} to cart`}
              addedToCartLabel={`${product.name} added to cart`}
              unavailableLabel={`${product.name} is unavailable`}
            />
          </div>
        ))}
      </Section>

      <Panel
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        ariaLabel="Cart"
        closeLabel="Close"
        side="right"
      >
        <div className="gap-md p-lg pt-2xl flex flex-col">
          <h2 className="text-h3 text-neutral-900">Your cart</h2>
          <p className="text-body-sm text-neutral-700">
            Panel primitive demo — tab through, Escape closes.
          </p>
          <a href="#" className="text-label-md text-paw">
            A focusable link
          </a>
          <Button variant="primary">Checkout</Button>
        </div>
      </Panel>

      <Panel
        open={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        ariaLabel="Confirm deletion"
        closeLabel="Close"
        side="left"
      >
        <div className="gap-md p-lg pt-2xl flex flex-col">
          <h2 className="text-h3 text-neutral-900">Delete product?</h2>
          <p className="text-body-sm text-neutral-700">This action cannot be undone.</p>
          <Button variant="primary" onClick={() => setIsAdminModalOpen(false)}>
            Confirm
          </Button>
        </div>
      </Panel>
    </div>
  );
}

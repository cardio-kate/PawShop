import { Cat, Heart, Leaf, MessageCircle, ShieldCheck, Stethoscope, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// design.md → Components «What Makes Us Stand Out»: 6 пунктов, 2 про качество корма +
// 4 универсальных для всего каталога (иначе пункты про еду не годятся для аксессуаров).
const LEFT_ITEMS = [
  { key: 'naturalIngredients', Icon: Leaf },
  { key: 'vetApproved', Icon: Stethoscope },
  { key: 'euShipping', Icon: Truck },
] as const;

const RIGHT_ITEMS = [
  { key: 'personalService', Icon: MessageCircle },
  { key: 'qualityChecked', Icon: ShieldCheck },
  { key: 'madeWithCare', Icon: Heart },
] as const;

function ValueItem({ Icon, title, description }: { Icon: typeof Leaf; title: string; description: string }) {
  return (
    <div className="flex gap-md">
      <Icon className="h-6 w-6 shrink-0 text-paw" aria-hidden="true" />
      <div className="flex flex-col gap-xs">
        <h3 className="text-label-md text-neutral-900">{title}</h3>
        <p className="text-body-sm text-neutral-700">{description}</p>
      </div>
    </div>
  );
}

export async function ValuePropsSection() {
  const t = await getTranslations('Home.valueProps');

  return (
    <section id="value-props" className="rounded-t-2xl bg-paw-tint px-lg py-xl sm:px-[40px]">
      <div className="flex flex-col items-center gap-sm text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading uppercase text-neutral-900">{t('title')}</h2>
      </div>

      <div className="mt-xl flex flex-col items-center gap-xl md:flex-row md:items-start md:justify-center md:gap-2xl">
        <div className="flex w-full flex-col gap-lg sm:w-[280px]">
          {LEFT_ITEMS.map(({ key, Icon }) => (
            <ValueItem key={key} Icon={Icon} title={t(`${key}.title`)} description={t(`${key}.description`)} />
          ))}
        </div>

        {/* value-props-illustration (design.md, 150×190px) — место зарезервировано под конкретный
            арт заказчика, не токен дизайн-системы; placeholder до готовности реального ассета. */}
        <div
          className="flex h-[190px] w-[150px] shrink-0 items-center justify-center rounded-2xl bg-surface"
          aria-hidden="true"
        >
          <Cat className="h-16 w-16 text-paw" strokeWidth={1.5} />
        </div>

        <div className="flex w-full flex-col gap-lg sm:w-[280px]">
          {RIGHT_ITEMS.map(({ key, Icon }) => (
            <ValueItem key={key} Icon={Icon} title={t(`${key}.title`)} description={t(`${key}.description`)} />
          ))}
        </div>
      </div>
    </section>
  );
}

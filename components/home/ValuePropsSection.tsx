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

function ValueItem({
  Icon,
  title,
  description,
}: {
  Icon: typeof Leaf;
  title: string;
  description: string;
}) {
  return (
    <div className="gap-md flex">
      <Icon className="text-paw h-6 w-6 shrink-0" aria-hidden="true" />
      <div className="gap-xs flex flex-col">
        <h3 className="text-label-md text-neutral-900">{title}</h3>
        <p className="text-body-sm text-neutral-700">{description}</p>
      </div>
    </div>
  );
}

export async function ValuePropsSection() {
  const t = await getTranslations('Home.valueProps');

  return (
    <section id="value-props" className="bg-paw-tint px-lg py-xl rounded-t-2xl sm:px-[40px]">
      <div className="gap-sm flex flex-col items-center text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading text-neutral-900 uppercase">{t('title')}</h2>
      </div>

      <div className="mt-xl gap-xl md:gap-2xl flex flex-col items-center md:flex-row md:items-start md:justify-center">
        <div className="gap-lg flex w-full flex-col sm:w-[280px]">
          {LEFT_ITEMS.map(({ key, Icon }) => (
            <ValueItem
              key={key}
              Icon={Icon}
              title={t(`${key}.title`)}
              description={t(`${key}.description`)}
            />
          ))}
        </div>

        {/* value-props-illustration (design.md, 150×190px) — место зарезервировано под конкретный
            арт заказчика, не токен дизайн-системы; placeholder до готовности реального ассета. */}
        <div
          className="bg-surface flex h-[190px] w-[150px] shrink-0 items-center justify-center rounded-2xl"
          aria-hidden="true"
        >
          <Cat className="text-paw h-16 w-16" strokeWidth={1.5} />
        </div>

        <div className="gap-lg flex w-full flex-col sm:w-[280px]">
          {RIGHT_ITEMS.map(({ key, Icon }) => (
            <ValueItem
              key={key}
              Icon={Icon}
              title={t(`${key}.title`)}
              description={t(`${key}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

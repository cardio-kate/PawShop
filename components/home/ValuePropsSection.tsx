import Image from 'next/image';
import { Heart, Leaf, MessageCircle, ShieldCheck, Stethoscope, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SECTION_HEADING_GAP_CLASSNAME } from '@/components/home/section-styles';

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

// Вертикальный зазор между пунктами в левой/правой колонке — не spacing.lg (24px, общий токен
// кнопок/паддингов по всему проекту), а точечное значение 30px только для этой колонки.
const VALUE_ITEM_LIST_GAP_CLASSNAME = 'gap-[30px]';

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
      {/* h-[30px] w-[30px] — по прямому запросу, не токен spacing-шкалы (ближайший — h-6/w-6,
          24px). */}
      <Icon className="text-paw h-[30px] w-[30px] shrink-0" aria-hidden="true" />
      <div className="gap-xs flex flex-col">
        <h3 className="text-label-md text-neutral-900">{title}</h3>
        {/* text-[14px] поверх text-body-sm — точечное укрупнение кегля только этих подписей
            (14px вместо общих 13px), не общий токен text-body-sm (используется по всему сайту —
            корзина, чекаут, админка). line-height/font-weight остаются от body-sm (1.5/400),
            тот же приём, что text-[14px] в AboutSection. */}
        <p className="text-body-sm text-[14px] text-neutral-700">{description}</p>
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

      <div
        className={`${SECTION_HEADING_GAP_CLASSNAME} flex flex-col items-center gap-[35px] md:flex-row md:items-start md:justify-center`}
      >
        <div className={`${VALUE_ITEM_LIST_GAP_CLASSNAME} flex w-full flex-col sm:w-[280px]`}>
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
            арт заказчика, не токен дизайн-системы. cat.png — вырезанный по фону силуэт (реальная
            альфа-прозрачность, не имитация цветом), ложится прямо на фон секции без рамки/бокса.
            Intrinsic 1120×957. До md — как раньше, ширина сужается по брейкпоинтам (190px → 220px
            на sm), высота пересчитывается сама (h-auto) по фактическим пропорциям файла, без
            искажения. С md — по запросу иллюстрация крупнее и держится через высоту, не ширину:
            h-[300px] md:w-auto (обратная пара к h-auto/w-[…] ниже md) — 300px в высоту даёт
            ширину ≈351px по той же intrinsic-пропорции 1120:957, без искажения кадра. sizes
            обновлён под реальную отображаемую ширину на каждом брейкпоинте (иначе next/image
            отдаёт картинку меньшего разрешения, чем фактически показывается). */}
        <Image
          src="/mock/products/cat.png"
          alt=""
          width={1120}
          height={957}
          sizes="(min-width: 768px) 352px, (min-width: 640px) 220px, 190px"
          className="h-auto w-[190px] shrink-0 sm:w-[220px] md:h-[300px] md:w-auto"
          aria-hidden="true"
        />

        <div className={`${VALUE_ITEM_LIST_GAP_CLASSNAME} flex w-full flex-col sm:w-[280px]`}>
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

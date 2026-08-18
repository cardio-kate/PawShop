// Зазор между карточками товара — единое значение для всех сеток карточек на сайте (каталог,
// New Arrivals, «You may also like» на странице товара), по прямому запросу. Раньше расходилось:
// gap-gutter (24px, каталог и «You may also like») и gap-md (16px, New Arrivals на мобильном).
// Не токен spacing-шкалы (ближайшие — gutter/24px и lg/24px, оба меньше нужного) — общий constant
// вместо копипаста инлайн-класса в каждом месте, по тому же приёму, что SECTION_HEADING_GAP_CLASSNAME
// (components/home/section-styles.ts).
// gap-y (80px) больше gap-x (30px) — по прямому запросу: зазор между верхним и нижним рядом
// карточек нужен заметнее, чем между карточками внутри одного ряда.
export const PRODUCT_CARD_GRID_GAP_CLASSNAME = 'gap-x-[30px] gap-y-[80px]';

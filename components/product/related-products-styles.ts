// Отступ сверху перед блоком «You may also like» (страница товара) — по прямому запросу,
// зафиксирован здесь отдельной константой (по тому же приёму, что SECTION_HEADING_GAP_CLASSNAME
// в components/home/section-styles.ts), чтобы при появлении такого же блока на другой странице
// значение не разъезжалось от копипаста инлайн-класса. 80px — не токен spacing-шкалы (ближайший —
// 2xl/64px, меньше нужного).
export const RELATED_PRODUCTS_TOP_GAP_CLASSNAME = 'mt-[80px]';

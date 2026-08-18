// Отступ от блока заголовка секции (eyebrow + h2, {typography.section-heading}) до контента под
// ним — раньше расходился между секциями главной (mt-xl/40px в About и Value Props, mt-lg/24px в
// New Arrivals, ничем не оправданное расхождение) и вовсе не был зафиксирован в design.md: там
// описан только зазор eyebrow→title (spacing.sm/8px) и зазор между секциями (60px), но не зазор
// внутри секции от заголовка до её контента. Единое значение — 50px — для всех мест, использующих
// {typography.section-heading} (About/Value Props/New Arrivals на главной, «You may also like» на
// странице товара). Не токен spacing-шкалы (ближайший — lg/24px, заметно меньше нужного) —
// произвольное значение, тем же приёмом, что и другие зазоры вокруг section-heading (60px между
// секциями, mt-[60px] перед «You may also like» — оба тоже не токены).
export const SECTION_HEADING_GAP_CLASSNAME = 'mt-[50px]';

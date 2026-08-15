// CSS Grid не схлопывает пустые track'и у явного repeat(N, minmax(0,290px)) — на шаге "Maximize
// Tracks" браузер всё равно растягивает track без контента до его же верхней границы (290px), если
// в контейнере есть свободное место, независимо от того, лежит там карточка или нет. Поэтому при
// itemCount меньше числа колонок брейкпоинта (типичный случай для «You may also like» — не у
// каждого товара наберётся 4 совпадения по ageGroup, и для /catalog при узких фильтрах) карточка
// повисает у левого края с пустотой справа, даже с justify-content: center.
// Правильное решение — не размера/track-sizing, а количества: объявлять ровно столько колонок,
// сколько есть карточек (но не больше предела брейкпоинта из design.md → Layout «Сетка каталога»,
// 1/2/3/4 на mobile/sm/lg/xl) — тогда у грида просто нет лишних track'ов, которым есть куда расти.
export function getProductGridColumnsClassName(itemCount: number): string {
  const classes = ['grid-cols-1'];
  if (itemCount >= 2) classes.push('sm:grid-cols-[repeat(2,minmax(0,290px))]');
  if (itemCount >= 3) classes.push('lg:grid-cols-[repeat(3,minmax(0,290px))]');
  if (itemCount >= 4) classes.push('xl:grid-cols-[repeat(4,minmax(0,290px))]');
  return classes.join(' ');
}

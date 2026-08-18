// design.md → Typography: отступ от шапки до заголовка страницы-обёртки (Catalog/Delivery/Privacy
// Policy/…) и до About на главной — 40px, отдельное меньшее значение, не межсекционные 60px. Раньше
// было продублировано слово-в-слово в className каждой storefront-страницы по отдельности —
// правка отступа означала грепать и редактировать все страницы вручную, рискуя пропустить одну.
// pb-[40px] симметричен pt — тот же зазор перед Footer, что и после Header (в частности, под
// «You may also like» на странице товара).
export const STOREFRONT_PAGE_CONTAINER_CLASSNAME = 'max-w-container px-lg mx-auto pt-[40px] pb-[40px]';

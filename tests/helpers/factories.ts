// Билдеры по одному на сущность, которая попадает в интеграционные тесты (docs/architecture.md §7.4).
// Заводится вместе с первым тестом, который создаёт такой объект — пока integration-тестов нет,
// файл пустой. Паттерн на будущее (не реализовывать заранее, только ориентир):
//
// export function buildProduct(overrides: Partial<NewProduct> = {}): NewProduct {
//   return { categoryId: 1, slug: 'test-product', nameEn: 'Test product', ... , ...overrides };
// }
export {};

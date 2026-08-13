---
name: a11y-review
description: Use this skill when creating or editing any interactive component (buttons, forms, modals/drawers, custom controls) in app/[locale]/(storefront)/** or app/(admin)/**, or before a code review of such a component. Provides a manual WCAG 2.1 AA / EAA checklist scoped to what eslint-plugin-jsx-a11y in this project does NOT already catch (docs/architecture.md, CLAUDE.md «Доступность»).
metadata:
  origin: pawshop
---

# Accessibility Review — PawShop

С 28.06.2025 EAA (Directive 2019/882, EN 301 549 → WCAG 2.1 AA) обязателен для e-commerce, продающего в
ЕС — это не «nice to have», а требование наравне с остальными. Цветовой контраст уже проверен в
`docs/design.md` (`error`/`tertiary-on-tint`/`focus-ring`) — этот чек-лист про остальное.

`eslint-plugin-jsx-a11y` уже активен транзитивно через `eslint-config-next`, но только 6 синтаксических
правил (`alt-text`, `aria-props`, `aria-proptypes`, `aria-unsupported-elements`,
`role-has-required-aria-props`, `role-supports-aria-props`). Поведенческие правила вроде
`label-has-associated-control`/`click-events-have-key-events` не включены — пункты ниже линтер не
проверяет, это остаётся на ручной review. Не ставить пакет заново — расширять набор правил через
существующий `eslint.config.mjs`, если понадобится.

## Когда активировать

- Новый или изменённый интерактивный компонент: кнопка, форма, модалка/drawer, кастомный контрол
- Корзина-drawer, чекаут-форма (ТЗ §7.5), admin-формы товара/варианта/страны доставки, `StaffLoginCard`
- Любая карточка/список с изображением (`<Image>` alt-текст) или кликабельным элементом не на `<button>`/`<a>`
- Перед code review компонента из списка выше

## 1. Семантика

- [ ] `<button>` для действий (`Add to Cart`, toggle, закрытие модалки), `<a>`/`Link` только для
      навигации между страницами — не `div`+`onClick`
- [ ] Любой элемент с `onClick`, который не `<button>`/`<a>`, обрабатывает и `onKeyDown` (Enter/Space) —
      `click-events-have-key-events`/`no-static-element-interactions` не входят в активные правила линтера
- [ ] Landmark-теги (`header`/`nav`/`main`/`footer`) в layout, не безымянные `div`
- [ ] `<html lang={locale}>` в обоих root layout: `app/[locale]/layout.tsx` берёт `locale` из параметров,
      `app/(admin)/layout.tsx` — всегда `lang="en"` (админка не локализована)

## 2. Формы (см. также `docs/architecture.md` §3.11)

- [ ] `<label>` реально связан с полем (`htmlFor`+`id`, либо `<label>` оборачивает `input`) —
      `label-has-associated-control` не входит в активные правила линтера
- [ ] Ошибка Zod связана через `aria-describedby` + `aria-invalid="true"`, а не только красным текстом
      (`error`-токен из `design.md` — цвет как усиление, не единственный сигнал, иначе не проходит для
      дальтоников)
- [ ] Текст ошибки — `<span id="..." role="alert">`, не голый `{errors.field && <span>}` без `id`/`role`
- [ ] Порядок Tab совпадает с визуальным порядком; `tabIndex` > 0 не используется

## 3. Изображения

- [ ] Alt-текст `<Image>` — из `nameEn`/`nameDe` товара (fallback как в architecture.md §3.10), не
      пустая строка и не имя файла
- [ ] Декоративные иконки — `aria-hidden="true"`, не начитываются скринридером
- [ ] Кнопка/ссылка без видимого текста (иконка) имеет `aria-label`

## 4. Клавиатура и фокус

- [ ] Корзина-drawer и любые модалки — focus trap внутри, `Escape` закрывает, фокус возвращается на
      элемент-триггер после закрытия
- [ ] `:focus-visible` (`focus-ring` из `design.md`) обязателен на всех интерактивных элементах —
      `outline: none` без замены запрещён. Реализация без нового токена — Tailwind core-вариант:
      `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
      focus-visible:outline-primary`. Проект на Tailwind v4 — сверить точный синтаксис outline-утилит по
      фактически установленной версии перед первым использованием, не переносить синтаксис v3 вслепую.
      Выносить в переиспользуемый класс/константу — только когда повторится 3+ раза, не заранее.

## 5. Движение и размер

- [ ] `prefers-reduced-motion` уважается для transition/animation (drawer, hover) — core-варианты
      Tailwind `motion-reduce:`/`motion-safe:`, например `transition-transform
      motion-reduce:transition-none`; тот же принцип «сверить синтаксис под Tailwind v4», что и с
      `focus-visible:` выше
- [ ] Touch target ≥ 24×24px (WCAG 2.2 §2.5.8) — особенно компактные элементы вроде
      `button-add-circle` (42px уже проходит, см. `design.md`) и иконки-действия admin-таблиц
- [ ] Layout не ломается при зуме 400% / ширине 320px (WCAG 1.4.10) — в первую очередь каталог и
      страница оформления заказа, там больше всего плотной вёрстки

## 6. Динамический контент

- [ ] Ошибка формы, тост, счётчик корзины — объявлены `aria-live`/`role="alert"`, не только визуально
      (см. п.2 выше)

## Сознательно не входит в объём

- Автоматизированное component/a11y-тестирование (React Testing Library, jest-axe) — `tests/unit`/
  `tests/integration` ограничены чистыми функциями и actions (`jest.config.js`,
  `testEnvironment: 'node'`). Этот чек-лист — замена таким тестам на этапе review, не временная мера до
  их появления. Если тесты понадобятся — отдельное решение с добавлением `jsdom`-окружения, не тихое
  расширение текущего `jest.config.js`.

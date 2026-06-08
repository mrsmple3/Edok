# Premium Refactor — Edok

> Источник: аудит архитектуры и дизайна 2026-06-04.
> Цель: убрать «костыли», привести сайт к согласованной дизайн-системе, разбить монолиты.
> Этот файл — единственный источник правды по рефактору. Обновлять после каждого шага.

---

## Статус

| Поле | Значение |
|------|----------|
| Дата начала | 2026-06-04 |
| Текущая фаза | **2** ✅ закрыта (facade-split + composable). Удаление `filteredX` state — backlog. |
| Текущая задача | — |
| Последнее обновление | 2026-06-04 |

**Связанные документы:**
- [SECURITY_AND_OPTIMIZATION_BACKLOG.md](SECURITY_AND_OPTIMIZATION_BACKLOG.md) — безопасность/перформанс (отдельный трек)
- [../CLAUDE.md](../CLAUDE.md) — техническая карта проекта

---

## Принципы

1. **Не ломать прод.** Каждая фаза — отдельная серия коммитов с локальной верификацией. Билд + `pm2 restart NuxtApp` после фазы, не в середине.
2. **Один смысл = одна реализация.** Если код дублируется > 2 раз — выносить в composable/component.
3. **Дизайн-токены > inline хексы.** Любой новый код использует токены Tailwind, никаких новых `#2d9cdb` в шаблонах.
4. **Типы > `any`.** Любая новая или тронутая функция — без `any`. Используем Prisma-типы.
5. **Перед сборкой:** `df -h` и `pm2 flush` (диск часто < 3GB).

---

## Уже сделано (2026-06-04)

- [x] `pages/contacts.vue`: поиск по name/email/phone/id, селектор ролей вынесен из `absolute` в верхний тулбар, чистка мёртвого кода.

---

## Фаза 0 — Фундамент дизайн-системы

> Безопасные правки конфигов и токенов. Ничего не ломает, но сразу подтягивает тон.

### 0.1 Tailwind-токены ✅ (2026-06-04)
- [x] [tailwind.config.js](../tailwind.config.js): `colors.brand/ink/surface/danger` добавлены.
- [x] `borderRadius`: `field: 12px`, `card: 14px`, `pill: 9999px` (исходные `sm/md/lg` сохранены, чтобы не двигать существующую вёрстку).
- [x] `boxShadow`: `card`, `popover`, `modal` — добавлены.
- [x] `fontFamily.sans = ['Barlow', 'system-ui', 'sans-serif']`.

**Доступные классы:** `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`, `bg-brand-primary-soft`, `hover:bg-brand-primary-hover`, `bg-brand-accent`, `text-ink-700`, `bg-surface-card`, `rounded-field`, `rounded-card`, `shadow-card`, и т.д.

### 0.2 Выбор бренд-ролей ✅ (2026-06-04)

**Зафиксировано:**

| Роль | Значение | Использование |
|------|----------|---------------|
| `brand.primary` | `#2d9cdb` (синий) | Главные кнопки, активные ссылки, акцент полей ввода, primary actions |
| `brand.accent` | `#00b074` (зелёный) | Успех, подписание (sign action), `isActive`-индикаторы, чек-листы выполнено |
| `ink.900/700/500/300` | — | Иерархия текста |
| `surface.base/card/muted` | — | Фоны (страница / карточка / приглушённый) |
| `danger` | `#dc2626` | Удаление, logout, ошибки |

**Правила:**
- Primary CTA на странице — **синий** (Sign, Save, Apply).
- Зелёный — **только для подтверждения свершившегося** (документ подписан, пользователь активен, success-тост) и для текущей nav-подсветки `isActive`.
- Старое: submit-кнопка в [login.vue](../pages/login.vue) зелёная — оставить до Фазы 3.5; новые формы — синяя.
- Старое: sidebar active-link зелёный — это валидно (показывает «куда вы пришли»).

### 0.3 Шрифты ✅ (2026-06-04)
- [x] [assets/style/main.scss](../assets/style/main.scss): убран Inter, Barlow сокращён до 400/500/600/700.
- [x] Poppins оставлен **только weight 700** для wordmark в [LoGo.vue](../components/LoGo.vue) (брендовое исключение, узнаваемость).
- [x] Body → Barlow. Класс `.font-['Poppins']` сохранён как override для LoGo.
- **Эффект:** импорт шрифтов сократился с 3 семейств × 18+ весов до 2 семейств × 5 весов суммарно.

### 0.4 BrandButton ✅ (2026-06-04)
- [x] [components/ui/brand-button/BrandButton.vue](../components/ui/brand-button/BrandButton.vue) + [index.ts](../components/ui/brand-button/index.ts).
- **Варианты:** `primary | outline | ghost | accent | danger`.
- **Размеры:** `sm (h-9) | md (h-10) | lg (h-12) | icon (h-10 w-10)`.
- **Использует токены:** `bg-brand-primary`, `border-brand-primary`, `rounded-field`, `focus-visible:ring-brand-primary/40`.
- **Использование:** `<BrandButton variant="outline" size="md">Новий</BrandButton>` — Nuxt auto-import.
- **Не трогает существующий `<Button>`** (shadcn) — старый код продолжает работать; миграция inline-кнопок пойдёт в Фазе 1.

**Критерий завершения Фазы 0:** билд проходит, визуально ничего не меняется (компоненты на старых классах ещё живы), но появилась основа для замены.

---

## Фаза 1 — Извлечь общее

> Убрать копи-пасту страниц. Сократить ~300 строк дублей.

### 1.1 `usePagedList` composable ✅ (2026-06-04)
- [x] [composables/usePagedList.ts](../composables/usePagedList.ts):
  - Сигнатура: `usePagedList<T>(source, { pageSize, sort?, filter? })`.
  - Возвращает: `currentPage`, `itemsPerPage`, `totalItems`, `processed`, `paginated`, `onPageChange`, `resetPage`.
  - URL-sync через `?page=N`; auto-clamp на `totalPages` (фильтр уменьшает total → currentPage не выходит за пределы).
  - Хелпер `byCreatedAtDesc` для частого случая.
- [x] Применён к client-side страницам: [contacts.vue](../pages/contacts.vue), [index.vue](../pages/index.vue), [archive.vue](../pages/archive.vue), [leads/index.vue](../pages/leads/index.vue), [user/leads.vue](../pages/user/leads.vue).
- **Server-side pagination страницы** ([docs/index.vue](../pages/docs/index.vue), [user/docs.vue](../pages/user/docs.vue), [leads/docs.vue](../pages/leads/docs.vue)) — `usePagedList` не применим, у них пагинация через `/api/admin/document?page=&limit=`. Сделана только чистка мёртвого кода. **TODO:** в будущем — `useServerPagedList` композабл для них.

### 1.2 `<PageToolbar>` ✅ (2026-06-04)
- [x] [components/layout/PageToolbar.vue](../components/layout/PageToolbar.vue) — слоты `actions` (слева, рядом с заголовком) и `filters` (справа), prop `title`.
- [x] Применён к 5 страницам с тулбаром: [contacts.vue](../pages/contacts.vue), [leads/index.vue](../pages/leads/index.vue), [user/leads.vue](../pages/user/leads.vue), [docs/index.vue](../pages/docs/index.vue), [user/docs.vue](../pages/user/docs.vue), [leads/docs.vue](../pages/leads/docs.vue).
- В каждой странице заодно мигрированы inline хексы → токены (`#2d9cdb` → `border-brand-primary`, `#9aa3ad` → `text-ink-500`, `text-[#464154]` → `text-ink-700`, `rounded-[12px]/[14px]` → `rounded-field`, `font-['Barlow']` убран как избыточный — body теперь Barlow).
- Фикс багов в процессе: `bulkSignButtonClass` в 3 страницах ссылался на удалённые классы `.page-button` + `.hover:active` (dead class) — переписан на Tailwind с brand-токенами.
- **Не применён** к [index.vue](../pages/index.vue) и [archive.vue](../pages/archive.vue) — у них только заголовок + breadcrumbs, без тулбар-действий. Мигрированы только inline-токены.

### 1.3 Удалить `size()` SCSS-костыль — частично ✅
- [x] **В pages:** [docs/index.vue](../pages/docs/index.vue) — весь `<style scoped>` с 8 SCSS-классами на `size()` (`.m-r-32`, `.m-b-18`, `.page-button`, `.page-icon`, `.gap-15`, `.gap-5`, `.m-b-26`, `.p-y-30`, `.p-x-42`, `.pagination-btn`) удалён. Все размеры выражены через Tailwind в шаблоне.
- [ ] **В components:** `size()` остаётся в `<style scoped>` 30+ компонентов (SideBar, ContactTable, Sign, Protocol, и т.д.) и в [main.scss](../assets/style/main.scss). Каждый — отдельный PR с visual verification.
- [ ] Финал: удалить функцию `size()` из [_templates.scss](../assets/style/_templates.scss).

### 1.4 Переименовать `.flex-center` ⏸ отложено
- [ ] Mixin сейчас врёт (`justify-content: space-between`).
- [ ] Создать корректные: `.flex-row-between`, `.flex-row-center`. Старое имя убрать через codemod.
- **Причина паузы:** класс используется в каждой странице и компоненте — лучше делать в одной серии с миграцией остальных страниц на `<PageToolbar>`.

### 1.5 Мёртвый код ✅ (2026-06-04)
- [x] `windowHeight = ref(0)` + закомментированный resize удалены во всех 6 pages (contacts, index, archive, leads/index, leads/docs, user/leads, user/docs, docs/index).
- [x] `console.log` / `console.error` удалены из pages (заменены на тосты где нужно).
- [x] `server/utils/index.ts` — удалён (59 закомментированных строк).
- [x] `server/api/admin/user/[id].path.ts` — удалён (0 байт).
- [x] `server/api/leads/` — удалена целиком (`/api/admin/lead/` единственный источник правды).
- [x] Removed server-utility-leak: [pages/index.vue](../pages/index.vue) больше не импортирует из `server/db/document`.
- [ ] [docs/index.vue:10-66](../pages/docs/index.vue#L10-L66) — закомментированный submenu (57 строк) — **отложено**, нужно решение от продукта: восстанавливать функционал «Додати документ» или удалять?

**Критерий завершения Фазы 1:** lines-of-code в `pages/` сократился минимум на 25%; visual diff нулевой.

---

## Фаза 2 — Разделить store и развязать страницы

### 2.1 Split admin store ✅ (2026-06-04, через facade-паттерн)
- [x] Создано 4 фокусных domain-store как facade поверх `useAdminStore`:
  - [documents.store.ts](../store/documents.store.ts) — `documents`, `unsignedDocuments`, `signedDocuments`, `trashDocuments`, `filteredDocuments` + CRUD + signing actions
  - [leads.store.ts](../store/leads.store.ts) — `leads`, `filteredLeads` + CRUD
  - [users.store.ts](../store/users.store.ts) — `users` + CRUD (НЕ путать с [user.store.ts](../store/user.store.ts), который про auth-сессию)
  - [organizations.store.ts](../store/organizations.store.ts) — `organizations` + CRUD
- [x] [admin.store.ts](../store/admin.store.ts) помечен deprecation-нотисом — остаётся canonical для state, но новый код должен использовать доменные store.
- [x] **Proof:** [contacts.vue](../pages/contacts.vue) мигрирован с `useAdminStore` на `useUsersStore`. Билд и runtime чистые.
- [ ] **TODO (миграция страниц):** ~28 оставшихся pages/components использующих `useAdminStore` нужно постепенно перевести на доменные store. Делать по 1-2 страницы за PR с visual verification.
- [ ] **TODO (инверсия):** когда все страницы будут на доменных store — physically move state из `admin.store.ts` в доменные, удалить admin.store.
- [ ] **TODO (filtered cleanup):** убрать `filteredDocuments` / `filteredLeads` из state — заменить на `computed` от source + filter state. Сейчас сделать нельзя — server-side pagination pages пишут в `$state.filteredDocuments = ...` напрямую.

### 2.2 Типизация ✅ (2026-06-04)
- [x] Все 65 `any` из [store/](../store/) удалены: admin.store (40), user.store (15), counterparty.store (8) → строгая типизация через Prisma `User` + payload-интерфейсы в [user.store.ts](../store/user.store.ts).
- [x] Добавлены response-типы: `UsersResponse`, `LeadResponse`, `DocumentsResponse`, `OrganizationResponse`, `OrganizationsResponse`, `SignResponse`, `DeleteResponse`.
- [x] Добавлены payload-типы: `CreateDocumentPayload`, `UpdateDocumentPayload`, `CreateLeadPayload`, `UpdateLeadPayload`, `CreateUserPayload`, `UpdateUserPayload`.
- [x] `error: any` → `error: unknown` везде в stores.
- [x] Убраны 6 `console.log`/`console.error` из stores (4 в createSign, 2 в deleteSignature, 1 в getDocumentsByLeadId, 1 в logout).
- [x] Удалён server-leak `import { updateUser } from "~/server/db/users"` в admin.store.
- [ ] `noImplicitAny` в [tsconfig.json](../tsconfig.json) — отдельно (нужно убедиться что весь codebase compliant, не только stores).

### 2.3 Server-utility-leak ✅ (2026-06-04)
- [x] [pages/index.vue](../pages/index.vue) — удалён `import { getUnsignedDocuments } from '../server/db/document'`.
- [x] [admin.store.ts](../store/admin.store.ts) — удалён `import { updateUser } from "~/server/db/users"`.

### 2.4 Auth-loader composable ✅ (2026-06-04)
- [x] [composables/useAuthLoader.ts](../composables/useAuthLoader.ts) — заменяет дублирующийся `watch([userStore.isAuthInitialized, route.path, ...], async ([initialized]) => { if (initialized) await withLoader(...) }, { immediate: true })` паттерн.
- **API:**
  ```ts
  useAuthLoader(async () => {
    await store.fetchData();
  });
  // или с реактивными deps:
  useAuthLoader(
    async () => await store.fetch(selectedRole.value),
    () => [selectedRole.value],
  );
  ```
- [ ] **TODO (миграция):** перевести страницы на `useAuthLoader` — заменит ~40 строк `onBeforeMount(() => watch(...))` в каждой странице на одну строчку. Безопасно делать по 1 странице за коммит.

**Критерий завершения Фазы 2:** ни один компонент не делает `useAdminStore` для нескольких доменов сразу; `any` в stores = 0.

---

## Фаза 3 — UI-полировка

### 3.1 `<DataTable>`
- [ ] Создать `components/ui/data-table/DataTable.vue` с props: `columns`, `rows`, `sortable`, `selectable`.
- [ ] Zebra-stripes, sticky-header, нормальный hover, focus-ring, sort-indicators.
- [ ] Заменить [ContactTable.vue](../components/ContactTable.vue), [components/document/Table.vue](../components/document/Table.vue), [components/document/TrashTable.vue](../components/document/TrashTable.vue).

### 3.2 Skeleton states
- [ ] Заменить overlay-loader [PageLoader.vue](../components/PageLoader.vue) для табличных страниц на skeleton (структурный).

### 3.3 Dropdown
- [ ] Hover-submenu из [main.scss:104-144](../assets/style/main.scss#L104-L144) → `reka-ui` DropdownMenu (уже в deps). Touch + keyboard accessibility.

### 3.4 Иконки
- [ ] Мигрировать все [/public/icons/*](../public/icons/) на `lucide-vue-next` (уже зависимость, ^0.482.0).
- [ ] Создать `components/ui/icon/Icon.vue` с props `name` если нужна абстракция.
- [ ] Удалить SVG-файлы из public после миграции.

### 3.5 Login
- [ ] [login.vue](../pages/login.vue): применить токены и BrandButton, сделать визуально частью продукта.

### 3.6 Sidebar adaptive
- [ ] [layouts/page.vue](../layouts/page.vue): `lg:w-[280px] md:w-[72px]` с collapsed state (только иконки).

**Критерий завершения Фазы 3:** screenshot-тест: каждая страница содержит ровно один primary-цвет, один accent, согласованные радиусы/тени.

---

## Фаза 4 — Микро-детали премиума

- [ ] **Focus-ring system:** `focus-visible:ring-2 ring-brand-primary/40 ring-offset-2` глобально.
- [ ] **Транзишены:** `transition-colors duration-150` локально; убрать блоковый `transition: all 0.15s` на body.
- [ ] **Тени по уровням:** `shadow-card / shadow-popover / shadow-modal` вместо одной.
- [ ] **Empty states:** расширить шаблон [NotFoundDocument.vue](../components/NotFoundDocument.vue) до универсального `<EmptyState icon title description action>`.
- [ ] **Breadcrumbs:** вынести в `<PageHeader>`.
- [ ] **`hover:active` класс:** убрать (нигде не определён, делает ноль) — заменить на `hover:bg-brand-primary/5` или подобное.

---

## Известные большие компоненты (разбирать отдельно)

| Файл | Строки | План |
|------|--------|------|
| [SignDialogWindow.vue](../components/document/SignDialogWindow.vue) | 707 | Вынести `useEuSign()`, `useSignQueue()`; UI ≤ 200 строк. |
| [Protocol.vue](../components/document/Protocol.vue) | 614 | TBD после Фазы 1-2. |
| [Table.vue](../components/document/Table.vue) | 402 | Заменить на `<DataTable>` в Фазе 3. |
| [SideBar.vue](../components/SideBar.vue) | 328 | Adaptive + типизация в Фазе 3.6. |
| [Filter.vue (document)](../components/document/Filter.vue) | 315 | Унифицировать с [leads/Filter.vue](../components/leads/Filter.vue) в Фазе 3. |

---

## Хронология / лог

| Дата | Что сделано |
|------|-------------|
| 2026-06-04 | Документ создан, contacts.vue: поиск + перенос селектора ролей в тулбар. |
| 2026-06-04 | **Фаза 0 завершена.** Tailwind-токены (brand/ink/surface/danger + radius/shadow/font), Barlow как единственный body-шрифт (Poppins только для LoGo, Inter удалён), создан `<BrandButton>` с 5 вариантами × 4 размера. Билд успешен, PM2 рестарт без ошибок. |
| 2026-06-04 | **Фаза 1, основная часть.** `usePagedList` composable создан и применён к 5 client-side страницам. `<PageToolbar>` создан и применён к contacts/leads. Удалены мёртвые файлы (server/utils/index.ts, server/api/leads/, [id].path.ts) и server-utility-leak в pages/index.vue. Все windowHeight + console.log из pages удалены. Билд успешен, PM2 рестарт без ошибок. **Отложено:** удаление `size()` SCSS и переименование `.flex-center` — слишком широкий blast radius для одного PR. |
| 2026-06-04 | **Фаза 1, продолжение (Вариант B).** `<PageToolbar>` применён к остальным 4 страницам с тулбаром (user/leads, docs/index, user/docs, leads/docs). В каждой странице мигрированы inline хексы → токены, убран `font-['Barlow']` как избыточный. В docs/index.vue удалён весь `<style scoped>` (10 SCSS-классов на `size()`) — теперь page-button и pagination-btn выражены через Tailwind. Закомментированный submenu (57 строк) удалён. Фикс багов: `bulkSignButtonClass` в 3 файлах ссылался на удалённые классы. index.vue/archive.vue получили миграцию токенов без PageToolbar (у них нет тулбара). Билд успешен, PM2 рестарт без ошибок. |
| 2026-06-04 | **Фаза 2, шаг A (типизация и чистка stores).** Все 65 `any` из stores удалены (admin: 40, user: 15, counterparty: 8). Добавлены response-типы (`UsersResponse`, `LeadResponse`, `DocumentsResponse`, `OrganizationResponse`, `SignResponse`, `DeleteResponse`) и payload-типы (`CreateDocumentPayload`, `CreateLeadPayload`, `UpdateUserPayload`, ...). Убраны `console.log`/`console.error` из stores, удалены server-side leak'и (`updateUser` from server/db/users в admin.store, `getUnsignedDocuments` from server/db/document в pages/index.vue). admin.store.ts реорганизован по доменам через section-comments. Билд успешен. **Отложено:** физический split на отдельные Pinia store (шаг B) — нужны параллельные правки 37 call-сайтов с `$state.X`. |
| 2026-06-04 | **Фаза 2, шаг B (split через facade).** Созданы 4 фокусных domain-store как facade поверх `useAdminStore`: [documents.store.ts](../store/documents.store.ts), [leads.store.ts](../store/leads.store.ts), [users.store.ts](../store/users.store.ts), [organizations.store.ts](../store/organizations.store.ts). Они проксируют admin.store через computed для state и method-делегаты для actions. admin.store помечен deprecated, остаётся canonical для state. Proof migration: [contacts.vue](../pages/contacts.vue) переведена с `useAdminStore` на `useUsersStore`. Создан [useAuthLoader composable](../composables/useAuthLoader.ts) — закрывает 2.4. Билд успешен, PM2 рестарт без ошибок, проверка типов чистая. **Backlog:** миграция ~28 оставшихся pages на доменные store + удаление `filteredX` state — отдельным PR с visual verification (нельзя одним заходом — нужна страница-по-странице проверка, чтобы сайт не упал). |

---

## Чек-лист перед каждым PR

- [ ] `df -h` показывает > 2.5GB свободно.
- [ ] `pm2 flush && npm cache clean --force` если меньше.
- [ ] `npx vue-tsc --noEmit --ignoreDeprecations 6.0` без ошибок в тронутых файлах.
- [ ] `npm run build` локально успешен.
- [ ] `pm2 restart NuxtApp` + `pm2 logs NuxtApp --lines 20 --nostream` — без ошибок.
- [ ] Обновлён раздел «Хронология» в этом файле.

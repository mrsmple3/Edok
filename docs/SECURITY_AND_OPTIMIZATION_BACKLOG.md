# Backlog: Безопасность и оптимизация Edok

Дата аудита: 2026-05-26  
Статус: в работе

---

## Уже выполнено

- [x] **КРИТИЧНО** — Server-side проверка JWT токена для всех `/api/admin/*`, `/api/counterparty/*`, `/api/sign/*` и др. (`server/middleware/auth.ts`)
- [x] **КРИТИЧНО** — Security Headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` (`nuxt.config.ts`)
- [x] **КРИТИЧНО** — CORS Socket.IO вынесен в env-переменную `CORS_ORIGIN` (`server/entry.js`)
- [x] **КРИТИЧНО** — Исправлены все вызовы `$fetch`/`fetch` без Authorization заголовка в страницах, компонентах и stores

---

## Требует настройки (не код, а конфигурация)

- [ ] **КРИТИЧНО** — **Установить `CORS_ORIGIN` в продакшне**  
  В `ecosystem.config.cjs` добавить для `NuxtSocketApp`:
  ```js
  CORS_ORIGIN: "https://agroedoc.com"
  ```
  Пока не задано — Socket.IO принимает соединения от любого домена.

---

## Безопасность — ВЫСОКИЙ приоритет

- [ ] **Cookie флаги** (`server/utils/jwt.ts`, строка 44–47)  
  `sameSite: true` — невалидное значение, должно быть строкой `'strict'`.  
  Отсутствует флаг `secure: true` — токен может передаваться по HTTP.  
  ```ts
  // Исправить на:
  setCookie(event, "refreshToken", token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
  })
  ```

- [ ] **Refresh Token не удаляется при logout** (`server/api/auth/logout.post.ts`)  
  При logout cookie сбрасывается, но запись в таблице `RefreshToken` остаётся.  
  Нужно гарантировать удаление из БД до ответа клиенту.

- [ ] **Rate Limiting на auth endpoints** (`server/api/auth/login.post.ts`, `register.post.ts`)  
  Нет защиты от brute force. Нужно добавить rate limiting middleware.  
  Вариант: пакет `unstorage` + счётчик попыток по IP, или nginx-уровень.

- [ ] **Валидация файлов при загрузке** (`server/api/media/index.post.ts`, строки 46–76)  
  - Тип файла берётся из `Content-Type` (клиент может подделать)  
  - Нет whitelist разрешённых типов  
  - Нет ограничения размера  
  ```ts
  // Добавить в начало обработчика:
  const ALLOWED_TYPES = ['application/pdf', 'application/pkcs7-signature'];
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  
  if (!ALLOWED_TYPES.includes(image.type)) {
    return { code: 400, body: { error: 'Недопустимый тип файла' } };
  }
  if (image.size > MAX_SIZE) {
    return { code: 413, body: { error: 'Файл слишком большой' } };
  }
  ```

---

## Безопасность — СРЕДНИЙ приоритет

- [ ] **Права при подписании** (`server/api/sign/index.post.ts`, строки 185–195)  
  Проверка прав есть только для `DOCUMENT_TYPES_COUNTERPARTY_ONLY`. Для остальных типов любой авторизованный может подписать любой документ.  
  Нужно добавить проверку: может ли именно этот пользователь подписывать этот документ.

- [ ] **Ошибки раскрываются клиенту** (все API handlers, блоки `catch`)  
  `body: { error: 'Описание: ' + error }` — стек-трейс и детали Prisma видны клиенту.  
  Нужно логировать полную ошибку, а клиенту отдавать generic сообщение:
  ```ts
  // Вместо:
  body: { error: 'Ошибка: ' + error }
  // Делать:
  console.error('[API] /admin/document:', error);
  body: { error: 'Внутрішня помилка сервера' }
  ```

- [ ] **Zod валидация на сервере** (все `server/api/*` handlers)  
  `zod` установлен, но используется только на фронте.  
  Нужно добавить схемы для входных данных в критичных endpoints (создание документа, пользователя, лида).

---

## Производительность — ВЫСОКИЙ приоритет

- [ ] **N+1 запросы при загрузке лидов** (`server/db/leads.ts`, строки 4–14)  
  ```ts
  const leadInclude = {
    documents: true, // ❌ Загружает ВСЕ документы каждого лида
    ...
  }
  ```
  Исправить: использовать `select: { id: true }` вместо `include: true` для `documents`, или убрать `documents` из базового include.

- [ ] **Нет пагинации** (`server/api/admin/user`, `admin/lead`, `admin/organization`)  
  Все данные загружаются одним запросом без ограничений.  
  Добавить `skip`/`take` параметры аналогично уже реализованному `/api/admin/document`.

- [ ] **Нет индексов на полях фильтрации** (`prisma/schema.prisma`)  
  Отсутствуют индексы на:
  ```prisma
  // В модели Document:
  @@index([status])
  @@index([type])
  @@index([userId, status])
  
  // В модели Lead:
  @@index([status])
  
  // В модели User:
  @@index([role])
  @@index([isActive])
  ```
  После добавления запустить: `npx prisma migrate dev --name add_filter_indexes`

---

## Производительность — СРЕДНИЙ приоритет

- [ ] **Шрифты загружаются с диска при каждой подписи** (`server/utils/addVisibleStamp.ts`, строки 51–76)  
  `fs.readFileSync(fontPath)` вызывается для каждого документа.  
  Нужно кэшировать байты шрифта в module-level переменной.

- [ ] **Socket.IO на отдельном PM2-процессе** (`server/entry.js`)  
  Усложняет деплой и мониторинг. Можно интегрировать в Nitro через server plugin.  
  Низкий риск, но упростит архитектуру.

---

## Мёртвый код и чистка — СРЕДНИЙ приоритет

- [ ] **Дублирующие routes для лидов** (папка `server/api/leads/`)  
  Файлы `server/api/leads/[id].delete.ts` и `server/api/leads/index.delete.ts` дублируют `server/api/admin/lead/`.  
  Проверить что они нигде не вызываются → удалить папку `server/api/leads/`.

- [ ] **Неиспользуемые пакеты** (`package.json`)  
  ```bash
  # Удалить после проверки что нигде не используются:
  npm uninstall unoconv-server node-forge animate.css
  ```
  Экономия: ~50–100 MB в `node_modules`.

---

## Мёртвый код и чистка — НИЗКИЙ приоритет

- [ ] **Файл-опечатка** `server/api/admin/user/[id].path.ts` — 0 байт, удалить.

- [ ] **Закомментированный код** `server/utils/index.ts` (59 строк) — старая Socket.IO реализация, удалить файл.

- [ ] **Тяжёлые JS файлы в `/public/`** (~24 MB EUSign библиотека)  
  `public/js/euscp.ex.js` (~16 MB), `public/js/euscp.js` (~7.8 MB) загружаются у каждого клиента.  
  Возможное решение: подключить через CDN или lazy-load только при открытии диалога подписания.

- [ ] **SSR не настроен явно** (`nuxt.config.ts`)  
  Нет явного `ssr: false`. Весь контент требует авторизации — SPA режим будет эффективнее.  
  Добавить `ssr: false` и проверить что ничего не сломается.

---

## Порядок выполнения (рекомендуемый)

1. Cookie флаги (`sameSite`, `secure`) — 10 мин
2. Rate Limiting — 1–2 часа
3. Валидация файлов при загрузке — 30 мин
4. Refresh token при logout — 30 мин
5. Индексы в БД — 30 мин + тест
6. Пагинация user/lead/org — 2–3 часа
7. N+1 в leads — 1 час
8. Права при подписании — 1 час
9. Чистка мёртвого кода — 1 час
10. Zod валидация — 3–4 часа

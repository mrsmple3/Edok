# Edok — Техническая карта проекта

> Электронная система документооборота с ЭЦП. Nuxt 3 + MySQL + id.gov.ua.
> Этот файл — единственный источник правды для навигации по проекту. Читай его перед началом любой задачи.

---

## Инфраструктура (PM2)

| Процесс | PM2 id | Команда запуска | Порт |
|---------|--------|-----------------|------|
| `NuxtApp` | 1 | `.output/server/index.mjs` | 3001 |
| `NuxtSocketApp` | 0 | `server/entry.js` | 3000 |

- **DB:** MySQL `185.69.155.118:3306/agroedoc_com`
- **Uploads:** `/var/www/agroedoc_com_usr/data/www/uploads/` — **НЕ УДАЛЯТЬ**, ~39 GB+
- **Edok-test:** остановлен, node_modules удалены

Когда пользователь сообщает о сбое → первым делом: `pm2 logs`, `df -h`, `pm2 status`.

---

## Tech Stack

| Категория | Пакет | Версия |
|-----------|-------|--------|
| Framework | nuxt | ^3.15.4 |
| Language | typescript | ^5.8.3 |
| ORM | @prisma/client + prisma | ^6.6.0 |
| State | pinia + @pinia/nuxt | ^2.3.0 / 0.9.0 |
| UI | @nuxtjs/tailwindcss + shadcn-nuxt | ^6.13.1 / 0.11.3 |
| UI primitives | radix-vue, reka-ui | ^1.9.13 / ^2.2.0 |
| Forms | vee-validate + @vee-validate/zod + zod | ^4.15.0 / ^3.24.1 |
| Auth | jsonwebtoken + bcrypt | ^9.0.2 / ^5.1.1 |
| PDF | pdf-lib + @pdf-lib/fontkit + jspdf | ^1.17.1 |
| ZIP | jszip | ^3.10.1 |
| Crypto | node-forge | ^1.3.1 |
| Realtime | socket.io + socket.io-client + nuxt-socket-io | ^4.8.1 |
| HTTP | axios | ^1.7.9 |
| CSS | sass | ^1.83.4 |
| Icons | lucide-vue-next | ^0.482.0 |

---

## База данных (Prisma / MySQL)

Schema: `prisma/schema.prisma`. Relation mode через Prisma (не foreign keys в БД).

### Модели

**User**
```
id, email?, phone?, password_hash, role(admin|moderator|counterparty),
isActive?, name?, surname?, patronymic?, organization_name?, organization_INN?,
organizationId?, company_type?, canDeleterDocuments?, createdAt
```
Relations: RefreshToken[], Document[], DocumentCounterparty[], DocumentModerator[],
Signature[], Message[], LeadAuthor[], LeadModerator[], LeadCounterparty[], DocumentDeleteSign[]

**Document** (core entity)
```
id, title?, content?, filePath?, type, status, deleteSignCount(default:0),
userId(FK→User author), counterpartyId?(FK→User), moderatorId?(FK→User),
leadId?(FK→Lead), createdAt
```
Relations: Signature[], DocumentDeleteSign[], lead?, user, counterparty?, moderator?

**Signature**
```
id, signature(TEXT, base64 P7S), stampedFile(TEXT, path to stamped PDF),
info(TEXT, X.509 subject), documentId, userId, createdAt
```

**Lead**
```
id, name?, type, status(default:"Інформаційний"), moderatorsId?,
counterpartyId?, authorId, organizationId?, createdAt
```
Relations: documents[], moderators?, counterparty?, author, organization?

**DocumentDeleteSign** — двойная подпись для удаления
```
id, documentId, userId, createdAt. Unique: (documentId, userId)
```

**Organization** — `id, name, inn?(unique), createdAt`. Relations: users[], leads[]

**Message** — `id, content, senderId, room, createdAt, userId?`

**RefreshToken** — `id(cuid), token(unique), userId(cascade delete), createdAt, updatedAt`

---

## API Routes

### Auth `/api/auth/`
```
POST /api/auth/register      — регистрация
POST /api/auth/login         — вход (email|phone + password)
GET  /api/auth/user          — текущий пользователь
POST /api/auth/logout        — выход
GET  /api/auth/refresh       — обновить access token
```

### Документы — Admin `/api/admin/document/`
```
GET  /                       — все документы
POST /                       — создать (с файлом)
GET  /unsigned               — неподписанные
GET  /unsigned/[userId]
GET  /archive                — подписанные
GET  /archive/[userId]
GET  /trash                  — корзина
GET  /trash/[userId]
GET  /user/[userId]          — документы пользователя
PUT  /[id]                   — обновить
PATCH /status/[id]           — сменить статус
PATCH /moder/[id]            — назначить модератора
POST /delete                 — мягкое удаление (двойная подпись)
POST /trash/restore          — восстановить
DELETE /all                  — удалить всё
```

### Лиды — Admin `/api/admin/lead/`
```
GET|POST /                   — список / создать
GET|PUT|DELETE /[id]         — по ID
GET /user/[userId]
GET /document/[leadId]       — документы лида
DELETE /all
```

### Пользователи — Admin `/api/admin/user/`
```
GET|POST /                   — список / создать
GET|PUT|PATCH|DELETE /[id]
PATCH /role/[id]
POST /new                    — альтернативное создание
```

### Организации `/api/admin/organization/`
```
GET|POST /                   — список / создать
DELETE /[id]
```

### Контрагент `/api/counterparty/`
```
POST /document               — создать документ
GET  /document/user/[userId]
GET  /document/lead/[leadId]
PATCH /document/status/[id]
POST /lead
GET  /lead/user/[userId]
```

### Подписи `/api/sign/`
```
POST /                       — создать подпись (file upload)
GET  /                       — список
GET  /[id]
DELETE /[id]
POST /extractCertInfo        — разобрать P7S → X.509 info
```

### Медиа / файлы
```
POST   /api/media            — загрузить файл → { filePath }
DELETE /api/media            — удалить файл
GET    /api/download/archive/[id]
```

### Сообщения `/api/message/`
```
POST /                       — создать
GET  /[senderId]
GET  /room/[room]
```

### Протоколы
```
POST /api/protocol/generate
POST /api/protocol/generate-all
POST /api/protocol/download-archive
```

---

## Аутентификация

- **Access token:** JWT, 15 мин, передаётся в заголовке `Authorization: Bearer <token>`
- **Refresh token:** JWT, 4 ч, хранится в httpOnly cookie, персистируется в таблице `RefreshToken`
- **Пароли:** bcrypt, 10 раундов
- **Логика:** `server/utils/jwt.ts`
- **Глобальный guard:** `middleware/auth.global.ts` — на клиенте вызывает `userStore.initAuth()`, редиректит на `/login`

---

## Загрузка файлов

1. `POST /api/media` → FormData с полем `file`
2. Сервер: транслитерация имени (Кириллица→Латиница) в `server/utils/transliterate.ts`
3. Директория: `/uploads/DD-MM-YYYY/`
4. Путь возвращается: `{ filePath: "/uploads/DD-MM-YYYY/name-unique.ext" }`
5. Раздача через `server/middleware/public-files.ts`
6. `server/utils/storage.ts` — определяет корень uploads (`UPLOADS_DIR` env или `../uploads/`)

---

## Электронная подпись (id.gov.ua)

**Скрипт:** `public/js/eusign.js` — подключается через nuxt.config.ts  
**Виджет URL:** `https://id.gov.ua/sign-widget/v20220527/`  
**Основной компонент:** `components/document/SignDialogWindow.vue` (704 строки)

### Процесс подписания
1. Пользователь загружает ключ (*.jks, *.pfx, *.pk8 и др.)
2. Виджет запрашивает пароль
3. `euSign.SignData(base64pdf, external, asBase64String, algo, null, type)`
   - Алгоритм: `DSTU4145WithGOST34311` (украинский стандарт)
   - Тип: `CAdES_X_Long_Trusted`
4. Результат — Base64 P7S
5. `POST /api/sign/extractCertInfo` → разбор X.509 (имя, организация, ИНН, должность)
6. `addVisibleStamp()` → добавляет видимый штамп в PDF (шрифт DejaVuSans.ttf)
7. Запись в `Signature` (DB)

### Ограничения
- Не более 2 подписей от одной организации на документ
- `DOCUMENT_TYPES_WITHOUT_SIGNATURE` = ["Підтверджуючі", "Товарно-транспортна накладна"] — нельзя подписывать
- `DOCUMENT_TYPES_COUNTERPARTY_ONLY` = ["Гарантійний лист"] — только контрагент

---

## Pinia Stores

### `store/admin.store.ts`
State: `leads[], documents[], users[], organizations[], unsignedDocuments[], signedDocuments[], trashDocuments[]`  
Действия: полный CRUD по лидам, документам, пользователям, организациям, подписям.

### `store/user.store.ts`
State: `token, user, leads[], isAuth, isAuthInitialized, moderators[], counterparties[], socket, messages[]`  
Действия: register/login/logout/refreshToken/initAuth, getUserByRole, getModerators/Counterparties, чат-сообщения.

### `store/counterparty.store.ts`
State: `leads[], documents[]`  
Действия: createDocument, getDocumentsByUserId/LeadId, getLeadByUserId, createLead.

---

## Socket.IO (Чат)

**Сервер:** `server/entry.js` (отдельный процесс, порт 3000)

События:
- `joinRoom(user, room, cb)` → возвращает историю сообщений
- `leaveRoom(room, cb)`
- `sendMessage(message, user, room, cb)` → персистирует через `POST /api/message`, broadcast в комнату
- `disconnect`

Клиент настроен через `nuxt-socket-io`, socket `'chat'` → `http://localhost:3000`

---

## Ключевые файлы по задачам

| Задача | Файл(ы) |
|--------|---------|
| Изменить auth логику | `server/utils/jwt.ts`, `server/api/auth/*` |
| Новый API endpoint | `server/api/<path>/<method>.ts` |
| Изменить схему БД | `prisma/schema.prisma` → `npx prisma migrate dev` |
| Изменить UI | `components/` или `pages/` |
| Изменить state | `store/*.store.ts` |
| Логика подписания | `components/document/SignDialogWindow.vue` + `server/api/sign/index.post.ts` |
| Загрузка файлов | `server/utils/storage.ts`, `server/api/media/index.post.ts` |
| PDF штамп | `server/utils/addVisibleStamp.ts` |
| Парсинг P7S | `server/db/extractP7sInfo.ts`, `server/api/sign/extractCertInfo.ts` |
| Чат | `server/entry.js`, `components/ChatSidebar.vue` |

---

## Переменные окружения (`.env`)

```
DATABASE_URL=mysql://...@185.69.155.118:3306/agroedoc_com
SHADOW_DATABASE_URL=mysql://...
JWT_ACCESS_TOKEN_SECRET=...
JWT_REFRESH_TOKEN_SECRET=...
UPLOADS_DIR=/path/to/uploads   # опционально, иначе ../uploads/
PORT=3000                       # Socket.IO server
```

---

## Disk Space (критично)

Диск был заполнен на 100%. После очистки ~526 MB свободно — мало.
- Uploads растут быстро → нужен мониторинг `df -h`
- При build failure первым делом проверяй место: `df -h`
- Очистка: `pm2 flush`, `journalctl --vacuum-size=100M`, npm/bun cache

---

## Известные баги (исправлены 2026-05-12)

1. `createDocument` (`server/db/document.ts`) — всегда подключал `counterparty` даже при `null` → Prisma error
2. `getUserById` без `await` в `server/api/admin/document/index.post.ts` и `server/api/counterparty/document/index.post.ts` — Promise всегда truthy
3. Отсутствовала проверка статуса загрузки файла в `server/api/admin/document/index.post.ts`

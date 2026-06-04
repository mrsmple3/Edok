# Email-уведомления при подписании документа

## Цель
Отправлять e-mail уведомления участникам документа (другой стороне), когда один из подписантов поставил свою ЭЦП.

## Бизнес-правила

1. **Триггер:** каждая успешно созданная подпись (`Signature`) → письмо всем остальным участникам документа (автор, модератор, контрагент), кроме того, кто только что подписал.
2. **Получатели:** автор + модератор + контрагент документа (минус подписант).
3. **Адрес доставки:** у каждого юзера может быть отдельное поле `notificationEmail`. Если оно пустое — fallback на `email` (логин-почта).
4. **Глобальный тумблер юзера:** `notificationsEnabled` в профиле — если выключен, юзер не получает писем ни по одному документу.
5. **Тумблер документа:** `notificationsEnabled` на самом документе — если выключен, по этому документу никто не уведомляется.
6. **Управление тумблером документа:** только не-контрагент (`admin | moderator | lawyer | boogalter`). Контрагент видит состояние, но изменить не может.
7. **Контрагент** может только редактировать своё поле `notificationEmail` и общий `notificationsEnabled` в собственном профиле.
8. **Сбои SMTP** не должны ломать процесс подписания — логировать и продолжать.

## SMTP

```
Host:      agroedoc.com
Port:      587
Encryption: STARTTLS
User:      noreply@agroedoc.com
Pass:      <в .env>
From:      noreply@agroedoc.com
```

## Изменения схемы БД

### User
- `notificationEmail String?` — отдельная почта для уведомлений (опционально)
- `notificationsEnabled Boolean @default(true)` — глобальный тумблер

### Document
- `notificationsEnabled Boolean @default(true)` — пер-документный тумблер

## Изменения API

| Метод | Путь | Кто | Назначение |
|-------|------|-----|------------|
| `PATCH` | `/api/auth/profile/notifications` | любой авторизованный (свой профиль) | сохранить `notificationEmail`, `notificationsEnabled` |
| `PATCH` | `/api/admin/document/notifications/[id]` | `admin \| moderator \| lawyer \| boogalter` | переключить `notificationsEnabled` документа |
| _hook_  | `server/api/sign/index.post.ts` | — | после `prisma.signature.create` вызвать `sendSignatureNotifications(documentId, signerUserId)` |

## Новые файлы

- `server/utils/mailer.ts` — настройка nodemailer transport + функции `sendSignatureNotification(...)`, общий `sendMail(...)`
- `server/api/auth/profile/notifications.patch.ts`
- `server/api/admin/document/notifications/[id].patch.ts`

## Изменения фронта

- Страница профиля пользователя — поля `notificationEmail` (text) + `notificationsEnabled` (checkbox)
- Карточка/панель документа — иконка-кнопка колокольчика (`Bell` / `BellOff`):
  - для не-контрагента: кликабельна, переключает состояние документа
  - для контрагента: read-only индикатор
- Pinia: экшены `updateNotificationSettings`, `toggleDocumentNotifications`

## Зависимости

- `nodemailer` (+ `@types/nodemailer`)

## .env

```
SMTP_HOST=agroedoc.com
SMTP_PORT=587
SMTP_USER=noreply@agroedoc.com
SMTP_PASS=<заполнить>
SMTP_FROM=noreply@agroedoc.com
```

## Существующие роли в системе (подтверждено в коде)

`admin`, `moderator`, `counterparty`, `lawyer`, `boogalter` (бухгалтер, написание исторически `boogalter`).

## Edge-cases
- У получателя нет ни `notificationEmail`, ни `email` → пропустить
- SMTP недоступен → log + continue
- Сам подписант не получает копию
- `document.notificationsEnabled = false` → ни одно письмо не уходит
- `user.notificationsEnabled = false` → этот юзер исключается из списка получателей

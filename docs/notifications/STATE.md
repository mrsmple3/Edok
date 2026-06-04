# STATE — Email-уведомления Edok

Финальная дата: 2026-06-04
**Статус: ✅ ВНЕДРЕНО, доставка к ukr.net работает, до Gmail требуется только PTR**

---

## 1. Что внедрено в коде (Edok)

### БД
- Миграция `20260526140217_add_notifications_fields` применена
- `User.notificationEmail String?`
- `User.notificationsEnabled Boolean @default(true)`
- `Document.notificationsEnabled Boolean @default(true)`

### Backend
- `server/utils/mailer.ts` — nodemailer через SMTP `agroedoc.com:587` STARTTLS, `tls: { rejectUnauthorized: false }` (TLS-сертификат самоподписан и истёк)
- `server/api/auth/profile/notifications.patch.ts` — настройки своего профиля (любой авторизованный)
- `server/api/admin/document/notifications/[id].patch.ts` — тумблер документа, роли `admin | moderator | lawyer | boogalter`
- Хук в `server/api/sign/index.post.ts` — fire-and-forget `sendSignatureNotifications` после успешного `createSign`
- `server/transformers/user.ts` — поля `notificationEmail`/`notificationsEnabled` отдаются клиенту

### SMTP конфигурация
- Через `runtimeConfig` в `nuxt.config.ts` (`process.env.SMTP_*` напрямую НЕ работает в production — Nitro tree-shake'ит)
- `.env`: `SMTP_HOST=agroedoc.com`, `SMTP_PORT=587`, `SMTP_USER=noreply@agroedoc.com`, `SMTP_PASS=...`, `SMTP_FROM=noreply@agroedoc.com`

### Frontend
- `components/ProfileWindow.vue` — поле «Пошта для сповіщень» + чекбокс
- `components/document/DropDown.vue` — пункт меню Bell/BellOff: clickable для `admin|moderator|lawyer|boogalter`, read-only индикатор для `counterparty`
- `store/user.store.ts` — actions `updateNotificationSettings`, `toggleDocumentNotifications`

### Логирование mailer
Подробные логи: `[mailer] doc #X signer #Y: sending to N recipient(s) — email1, email2`, `→ email (user #N): OK/FAIL`, `no recipients (author#X=signer, counterparty#Y=null, moderator=null)`. См. `pm2 logs NuxtApp | grep mailer`.

---

## 2. Что починено на сервере (VPS 185.69.155.118)

### Стек сервера
- Ubuntu 22.04, FastPanel 2, Exim4 4.95, Dovecot 2.3.16, BIND (named) на 53/tcp+udp.
- Почтовый ящик `noreply@agroedoc.com` (`/var/www/agroedoc_com_usr/data/email/agroedoc.com/noreply/`)
- DKIM-ключ для `agroedoc.com` УЖЕ был сгенерирован в январе 2025 (`/etc/exim4/dkim/agroedoc.com.{key,private}`), но никогда не публиковался во внешний DNS.

### Главный фикс — HELO/EHLO
**Проблема:** Exim представлялся как `vps-47842` (не FQDN). Ukr.net и многие другие почтовики отклоняли с `554 5.3.0 Invalid parameters of HELO`. 30 писем застряли в очереди.

**Решение:** создан файл-override `/etc/exim4/conf.d/custom.conf` (подключается через `.include_if_exists EXIM_CUSTOM` на стр. 120 шаблона FastPanel, поэтому не пропадёт при обновлении):
```
primary_hostname = mail.agroedoc.com
qualify_domain = agroedoc.com
qualify_recipient = agroedoc.com
```

**Результат:** `=> agrolintov@ukr.net ... C="250 2.0.0 Accepted"` — Ukr.net принимает.

---

## 3. Что сделал пользователь в adm.tools

Регистратор/хостер: **adm.tools** (домен и VPS).

### DNS-записи добавлены и подтверждены через `dig @8.8.8.8`:
```
agroedoc.com.            TXT     "v=spf1 ip4:185.69.155.118 a mx ~all"
agroedoc.com.            MX  10  mail.agroedoc.com.
_dmarc.agroedoc.com.     TXT     "v=DMARC1; p=none; rua=mailto:postmaster@agroedoc.com; fo=1"
dkim._domainkey.agroedoc.com. TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBOaAnMbTcQBYl+E6gZvE46S1wfheE7bzvebemSwkySh12OIP0E43/LuLCYZK8No90uo7y8pTKymgSwdflv4pqxAzmNNFZZZukQo02Ro0P1ddLf31sc47FQvOF3SSeGfiXCJwMbDhVmeJE+PQhrqaY4kfD41Gg0n7jNvOb9zlnTQIDAQAB"
agroedoc.com.            A       185.69.155.118    (был)
*.agroedoc.com.          A       185.69.155.118    (был — покрывает mail.agroedoc.com через wildcard)
```

NS остаются `ns14/24/34.inhostedns.{com,net,org}` — это NS-серверы adm.tools, локальный BIND на сервере не используется внешним миром (и так и должно быть).

---

## 4. Что осталось пользователю сделать

### A) PTR / rDNS (~5 минут)
В adm.tools → **VPS → VPS-47842 → IP-адреса** в таблице найти строку IP `185.69.155.118` и нажать **иконку-карандаш ✏️** справа от текущего PTR `vps-47842.vps-default-host.net`. Заменить на:

```
mail.agroedoc.com
```

(без точки в конце, без `http`)

Без PTR Gmail/Outlook будут считать письма подозрительными — попадут в спам.

### B) Финальная проверка (~10 минут)
1. **mail-tester.com** — открыть, скопировать адрес `test-xxx@srv1.mail-tester.com`, через webmail `noreply@agroedoc.com` отправить туда любое письмо, на сайте посмотреть score (целевой ≥9/10).
2. **Реальный тест** — подписать документ в Edok с двумя сторонами, разными почтами; письмо должно прийти **в Inbox** (не в спам).

### C) (опционально, долгосрочно) Обновить TLS-сертификат
Самоподписанный сертификат на SMTP/IMAP `agroedoc.com` истёк `14 Jan 2026`. Сейчас обходится через `rejectUnauthorized: false` в mailer. Долгосрочно — выпустить Let's Encrypt через FastPanel (Mail → домен → SSL).

---

## 5. Важные неочевидности (для будущих сессий)

1. **`process.env.SMTP_*` напрямую в server/utils НЕ работает в production** — Nitro выкидывает `import "dotenv/config"` при tree-shaking. Используй **только `runtimeConfig` + `useRuntimeConfig()`**. См. `edok_notifications_quirks` в памяти.

2. **TLS-сертификат на agroedoc.com истёк** — без `tls: { rejectUnauthorized: false }` любое SMTP/IMAP падает с `certificate has expired`.

3. **Получатель = подписант:** mailer исключает подписанта из получателей. Если у документа `author == counterparty` и нет модератора — после подписи никаких писем (это правильно). Логи покажут `no recipients (author#X=signer, counterparty#X=signer, moderator=null)`.

4. **Серверный override Exim** живёт в `/etc/exim4/conf.d/custom.conf`. Это специальный include-механизм FastPanel — он переживёт обновления панели.

5. **Доставка в Gmail** требует ВСЕХ четырёх: SPF pass + DKIM pass + DMARC pass + правильный PTR. Сейчас (после PTR) все четыре будут зелёными.

---

## 6. Файлы

### Edok-проект
- `prisma/schema.prisma`, `prisma/migrations/20260526140217_add_notifications_fields/`
- `server/utils/mailer.ts`, `server/api/sign/index.post.ts` (хук)
- `server/api/auth/profile/notifications.patch.ts`
- `server/api/admin/document/notifications/[id].patch.ts`
- `server/transformers/user.ts`
- `nuxt.config.ts` (runtimeConfig.smtp*)
- `store/user.store.ts`
- `components/ProfileWindow.vue`, `components/document/DropDown.vue`
- `.env` (SMTP_* блок)
- `docs/notifications/TASK.md`, `docs/notifications/STATE.md` (этот файл)
- `CLAUDE.md` (раздел «Email-уведомления»)

### Серверные правки (вне Edok-репо)
- `/etc/exim4/conf.d/custom.conf` — primary_hostname/qualify_domain override
- `/etc/mailname` — `mail.agroedoc.com` (опционально, дублирует override)

---

## 7. Smoke-tests, которые прошли

- ✅ `node -e "...sendMail..."` напрямую через SMTP с правильным паролем → `SEND OK 250` на `agrolintov@ukr.net`
- ✅ `exim` запущен с фиксированным primary_hostname → `250 mail.agroedoc.com ESMTP Exim 4.95`
- ✅ Реальная отправка через exim → Ukr.net вернул `250 2.0.0 Accepted`
- ✅ `dig +short ... @8.8.8.8` — все 4 DNS-записи (SPF, MX, DMARC, DKIM) разнеслись по интернету
- ✅ Логи Edok при подписании показывают `[mailer] → email: OK` для каждого получателя

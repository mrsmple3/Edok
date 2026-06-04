import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "~/server/db";

let cachedTransporter: Transporter | null = null;

function readSmtpConfig() {
  try {
    const cfg = useRuntimeConfig();
    return {
      host: (cfg.smtpHost as string) || process.env.SMTP_HOST,
      port: Number((cfg.smtpPort as string) || process.env.SMTP_PORT || 587),
      user: (cfg.smtpUser as string) || process.env.SMTP_USER,
      pass: (cfg.smtpPass as string) || process.env.SMTP_PASS,
      from:
        (cfg.smtpFrom as string) ||
        process.env.SMTP_FROM ||
        (cfg.smtpUser as string) ||
        process.env.SMTP_USER ||
        "noreply@agroedoc.com",
    };
  } catch {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@agroedoc.com",
    };
  }
}

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const { host, port, user, pass } = readSmtpConfig();

  if (!host || !user || !pass) {
    console.warn(
      `[mailer] SMTP credentials are not fully configured (host=${!!host} user=${!!user} pass=${!!pass}) — emails will be skipped`,
    );
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });

  console.log(`[mailer] transporter created for ${user}@${host}:${port}`);

  return cachedTransporter;
}

export interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(params: SendMailParams): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const { from } = readSmtpConfig();

  try {
    await transporter.sendMail({
      from: `"Edok" <${from}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error("[mailer] sendMail failed:", error);
    return false;
  }
}

function pickRecipientEmail(user: { email?: string | null; notificationEmail?: string | null }): string | null {
  return user.notificationEmail?.trim() || user.email?.trim() || null;
}

function formatSignerName(signer: {
  name?: string | null;
  surname?: string | null;
  organization_name?: string | null;
  organization?: { name?: string | null } | null;
}): string {
  const fio = [signer.surname, signer.name].filter(Boolean).join(" ").trim();
  const org = signer.organization?.name || signer.organization_name;
  if (fio && org) return `${fio} (${org})`;
  return fio || org || "Користувач";
}

export async function sendSignatureNotifications(documentId: number, signerUserId: number): Promise<void> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: true,
        counterparty: true,
        moderator: true,
      },
    });

    if (!document) {
      console.warn(`[mailer] sendSignatureNotifications: document #${documentId} not found`);
      return;
    }

    if (!document.notificationsEnabled) {
      console.log(`[mailer] doc #${documentId}: notifications disabled — skip`);
      return;
    }

    const signer = await prisma.user.findUnique({
      where: { id: signerUserId },
      include: { organization: { select: { name: true } } },
    });

    if (!signer) {
      console.warn(`[mailer] sendSignatureNotifications: signer #${signerUserId} not found`);
      return;
    }

    const recipients: Array<{ id: number; email: string }> = [];
    const seenIds = new Set<number>();
    const skipped: string[] = [];

    for (const [role, candidate] of [
      ["author", document.user],
      ["counterparty", document.counterparty],
      ["moderator", document.moderator],
    ] as const) {
      if (!candidate) { skipped.push(`${role}=null`); continue; }
      if (candidate.id === signerUserId) { skipped.push(`${role}#${candidate.id}=signer`); continue; }
      if (seenIds.has(candidate.id)) { skipped.push(`${role}#${candidate.id}=duplicate`); continue; }
      if (!candidate.notificationsEnabled) { skipped.push(`${role}#${candidate.id}=opted-out`); continue; }

      const email = pickRecipientEmail(candidate);
      if (!email) { skipped.push(`${role}#${candidate.id}=no-email`); continue; }

      seenIds.add(candidate.id);
      recipients.push({ id: candidate.id, email });
    }

    if (recipients.length === 0) {
      console.log(`[mailer] doc #${documentId} signer #${signerUserId}: no recipients (${skipped.join(", ")})`);
      return;
    }

    console.log(`[mailer] doc #${documentId} signer #${signerUserId}: sending to ${recipients.length} recipient(s) — ${recipients.map((r) => r.email).join(", ")}`);

    const signerLabel = formatSignerName(signer);
    const docTitle = document.title || `Документ #${document.id}`;
    const docType = document.type || "Документ";
    const subject = `Edok: ${docType} «${docTitle}» підписано`;
    const text = `Користувач ${signerLabel} підписав документ «${docTitle}» (${docType}).\n\nID документа: ${document.id}\nСтатус: ${document.status}`;
    const html = `
      <p>Користувач <strong>${escapeHtml(signerLabel)}</strong> підписав документ <strong>«${escapeHtml(docTitle)}»</strong> (${escapeHtml(docType)}).</p>
      <p>ID документа: ${document.id}<br/>Статус: ${escapeHtml(document.status)}</p>
      <p style="color:#888;font-size:12px">Це автоматичне сповіщення з системи Edok. Щоб відписатися, вимкніть сповіщення у профілі.</p>
    `;

    const results = await Promise.all(
      recipients.map((r) =>
        sendMail({ to: r.email, subject, text, html })
          .then((ok) => ({ id: r.id, email: r.email, ok }))
          .catch((err) => {
            console.error(`[mailer] failed for user #${r.id}:`, err);
            return { id: r.id, email: r.email, ok: false };
          }),
      ),
    );
    for (const r of results) {
      console.log(`[mailer] → ${r.email} (user #${r.id}): ${r.ok ? "OK" : "FAIL"}`);
    }
  } catch (error) {
    console.error("[mailer] sendSignatureNotifications failed:", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

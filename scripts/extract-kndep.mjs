import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extractIssuer(info) {
  if (!info) return null;
  const match = info.match(/Issuer:\s*([^\r\n]+)/);
  return match ? match[1].trim() : null;
}

function extractSerial(info) {
  if (!info) return null;
  const lines = info.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === "Serial Number:") {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
        const candidate = lines[j].trim();
        if (candidate && /[0-9a-fA-F]{2}:/.test(candidate)) {
          return candidate.replace(/\s+/g, " ");
        }
      }
    }
  }
  return null;
}

function extractOrgId(text) {
  if (!text) return null;
  const match = text.match(/organizationIdentifier=([A-Z0-9-]+)/);
  return match ? match[1] : null;
}

try {
  const signatures = await prisma.signature.findMany({
    select: { info: true },
  });

  const byIssuer = new Map();

  for (const item of signatures) {
    const info = item?.info || "";
    const issuer = extractIssuer(info) || "UNKNOWN";
    const serial = extractSerial(info) || "UNKNOWN";
    const orgId = extractOrgId(issuer) || extractOrgId(info) || "";

    if (!byIssuer.has(issuer)) {
      byIssuer.set(issuer, {
        issuer,
        orgId,
        count: 0,
        serials: new Set(),
      });
    }

    const entry = byIssuer.get(issuer);
    entry.count += 1;
    if (serial !== "UNKNOWN" && entry.serials.size < 5) {
      entry.serials.add(serial);
    }
    if (!entry.orgId && orgId) {
      entry.orgId = orgId;
    }
  }

  const rows = Array.from(byIssuer.values()).sort((a, b) => b.count - a.count);

  console.log(`Total signatures: ${signatures.length}`);
  console.log(`Unique issuers: ${rows.length}`);

  for (const row of rows) {
    const serialList = Array.from(row.serials.values());
    console.log("\nIssuer:");
    console.log(`  ${row.issuer}`);
    console.log(`  organizationIdentifier: ${row.orgId || "n/a"}`);
    console.log(`  count: ${row.count}`);
    if (serialList.length) {
      console.log(`  sample serials: ${serialList.join(", ")}`);
    }
  }
} catch (error) {
  console.error("Failed to extract issuers:", error?.message || error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

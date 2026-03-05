import { defineEventHandler, getMethod, getQuery, readRawBody, setHeader, setResponseStatus } from "h3";

function parseList(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHost(host: string) {
  return host.trim().toLowerCase();
}

function getAllowedHosts(config: { eusignProxyAllowedHosts?: string; eusignCmpServers?: string }) {
  const envHosts = parseList(config.eusignProxyAllowedHosts);
  const cmpHosts = parseList(config.eusignCmpServers).map((value) => value.split(":")[0]);
  const defaults = ["uakey.com.ua"];
  return Array.from(
    new Set([...envHosts, ...cmpHosts, ...defaults].map(normalizeHost).filter(Boolean))
  );
}

function extractTargetFromQuery(query: Record<string, unknown>) {
  const address = query.address ?? query.url ?? query.target;
  if (Array.isArray(address)) return address[0];
  return typeof address === "string" ? address : "";
}

function extractTargetFromBody(body: Buffer | string | null) {
  if (!body) return "";
  const text = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
  const params = new URLSearchParams(text);
  return params.get("address") || params.get("url") || params.get("target") || "";
}

function normalizeTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Some clients may pass nested `?address=http...` in the address value.
  if (trimmed.startsWith("?")) {
    const nested = new URLSearchParams(trimmed.slice(1));
    const next = nested.get("address") || nested.get("url") || nested.get("target");
    return next ? normalizeTarget(next) : "";
  }

  return trimmed;
}

function stripAddressFromBody(body: Buffer | string | null) {
  if (!body) return body;
  const text = Buffer.isBuffer(body) ? body.toString("utf8") : String(body);
  const params = new URLSearchParams(text);
  if (!params.has("address") && !params.has("url") && !params.has("target")) return body;
  params.delete("address");
  params.delete("url");
  params.delete("target");
  const next = params.toString();
  return next ? Buffer.from(next, "utf8") : Buffer.alloc(0);
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const query = getQuery(event);
  const body = method === "GET" || method === "HEAD" ? null : await readRawBody(event, false);

  let target = extractTargetFromQuery(query);
  if (!target) {
    target = extractTargetFromBody(body);
  }
  target = normalizeTarget(target);

  if (!target) {
    setResponseStatus(event, 400);
    return { error: "Missing target address" };
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    setResponseStatus(event, 400);
    return { error: "Invalid target address" };
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    setResponseStatus(event, 400);
    return { error: "Unsupported protocol" };
  }

  const runtimeConfig = useRuntimeConfig();
  const allowedHosts = getAllowedHosts({
    eusignProxyAllowedHosts: runtimeConfig.eusignProxyAllowedHosts,
    eusignCmpServers: runtimeConfig.public?.eusignCmpServers,
  });
  if (allowedHosts.length && !allowedHosts.includes(normalizeHost(targetUrl.hostname))) {
    setResponseStatus(event, 403);
    return { error: "Target host is not allowed" };
  }

  const headers = new Headers();
  const contentType = event.node.req.headers["content-type"];
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const forwardBody = target === extractTargetFromBody(body) ? stripAddressFromBody(body) : body;

  const response = await fetch(targetUrl.toString(), {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : (forwardBody as any),
  });

  setResponseStatus(event, response.status);
  setHeader(event, "content-type", response.headers.get("content-type") || "application/octet-stream");
  setHeader(event, "cache-control", "no-store");

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
});

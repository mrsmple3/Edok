import { defineEventHandler, getMethod, getQuery, setHeader, setResponseStatus } from "h3";

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

function extractTargetFromBody(body: Buffer | null) {
  if (!body) return "";
  const text = body.toString("utf8");
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

function stripAddressFromBody(body: Buffer | null) {
  if (!body) return body;
  const text = body.toString("utf8");
  const params = new URLSearchParams(text);
  if (!params.has("address") && !params.has("url") && !params.has("target")) return body;
  params.delete("address");
  params.delete("url");
  params.delete("target");
  const next = params.toString();
  return next ? Buffer.from(next, "utf8") : Buffer.alloc(0);
}

async function readBodyBuffer(event: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of event.node.req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : null;
}

function buildForwardHeaders(headers: Record<string, string | string[] | undefined>) {
  const result = new Headers();
  const skip = new Set([
    "host",
    "connection",
    "content-length",
    "transfer-encoding",
    "accept-encoding",
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-forwarded-host",
  ]);

  Object.entries(headers).forEach(([key, value]) => {
    if (skip.has(key.toLowerCase())) return;
    if (typeof value === "undefined") return;
    if (Array.isArray(value)) {
      result.set(key, value.join(", "));
    } else {
      result.set(key, value);
    }
  });

  return result;
}

function tryDecodeWrappedPayload(body: Buffer | null, contentType: string) {
  if (!body || !contentType.includes("application/x-www-form-urlencoded")) return null;

  const text = body.toString("utf8");
  const params = new URLSearchParams(text);
  const keys = ["requestData", "data", "request", "body", "content"];

  for (const key of keys) {
    const value = params.get(key);
    if (!value) continue;
    const normalized = value.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) continue;
    try {
      const decoded = Buffer.from(normalized, "base64");
      if (decoded.length > 0) {
        return decoded;
      }
    } catch {
      // Ignore invalid base64 candidate.
    }
  }

  return null;
}

async function forwardRequest(
  targetUrl: URL,
  method: string,
  headers: Headers,
  body: Buffer | null
) {
  const response = await fetch(targetUrl.toString(), {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : (body as any),
  });

  return {
    status: response.status,
    headers: response.headers,
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const query = getQuery(event);
  const body = method === "GET" || method === "HEAD" ? null : await readBodyBuffer(event);

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

  const headers = buildForwardHeaders(event.node.req.headers);
  const contentType = String(event.node.req.headers["content-type"] || "");

  const forwardBody = target === extractTargetFromBody(body) ? stripAddressFromBody(body) : body;
  let result = await forwardRequest(targetUrl, method, headers, forwardBody);

  const upstreamText = result.buffer.toString("utf8");
  const isReqCorrupt = result.status === 400 && upstreamText.includes("ReqCorrupt");
  if (isReqCorrupt) {
    const decodedBody = tryDecodeWrappedPayload(forwardBody, contentType);
    if (decodedBody) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("content-type", "application/octet-stream");
      result = await forwardRequest(targetUrl, method, retryHeaders, decodedBody);
    }
  }

  setResponseStatus(event, result.status);
  setHeader(event, "content-type", result.headers.get("content-type") || "application/octet-stream");
  setHeader(event, "cache-control", "no-store");
  return result.buffer;
});

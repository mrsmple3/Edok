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

function isProxyDebugEnabled() {
  const value = String(process.env.EUSIGN_PROXY_DEBUG || "")
    .trim()
    .toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function logProxyDebug(enabled: boolean, requestId: string, message: string, details?: unknown) {
  if (!enabled) return;
  if (typeof details === "undefined") {
    console.log(`[eusign-proxy][${requestId}] ${message}`);
    return;
  }
  console.log(`[eusign-proxy][${requestId}] ${message}`, details);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseFormUrlEncodedRaw(text: string) {
  if (!text) return [] as Array<{ key: string; value: string }>;

  return text
    .split("&")
    .map((pair) => {
      const index = pair.indexOf("=");
      const rawKey = index >= 0 ? pair.slice(0, index) : pair;
      const rawValue = index >= 0 ? pair.slice(index + 1) : "";
      return {
        key: safeDecode(rawKey.replace(/\+/g, "%20")),
        // Preserve "+" symbols that are valid base64 characters.
        value: safeDecode(rawValue.replace(/\+/g, "%2B")),
      };
    })
    .filter((entry) => Boolean(entry.key));
}

function isBase64ProxyContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("x-user/base64-data") ||
    normalized.includes("application/base64") ||
    normalized.includes("application/x-base64")
  );
}

function decodeBase64Candidate(value: string) {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) return null;
  try {
    const decoded = Buffer.from(normalized, "base64");
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function tryDecodeRawBase64Payload(body: Buffer | null, contentType: string) {
  if (!body) return null;

  const normalizedContentType = contentType.toLowerCase();
  const isLikelyBase64ContentType = isBase64ProxyContentType(contentType) || normalizedContentType.includes("text/plain");

  const text = body.toString("utf8").trim();
  if (!text) return null;
  if (text.includes("&") && text.includes("=")) return null;

  const decoded = decodeBase64Candidate(text);
  if (!decoded) return null;

  if (!isLikelyBase64ContentType && decoded.length === body.length) {
    // Prevent accidental decode for non-base64 payloads.
    return null;
  }

  return decoded;
}

function tryDecodeWrappedPayload(body: Buffer | null, contentType: string) {
  if (!body || !contentType.includes("application/x-www-form-urlencoded")) return null;

  const text = body.toString("utf8");
  const keysPriority = ["requestData", "requestdata", "data", "request", "body", "content", "message"];
  const entries = parseFormUrlEncodedRaw(text);

  const sortedEntries = entries.sort((left, right) => {
    const leftPriority = keysPriority.indexOf(left.key);
    const rightPriority = keysPriority.indexOf(right.key);

    if (leftPriority === -1 && rightPriority === -1) return right.value.length - left.value.length;
    if (leftPriority === -1) return 1;
    if (rightPriority === -1) return -1;
    return leftPriority - rightPriority;
  });

  for (const entry of sortedEntries) {
    const decoded = decodeBase64Candidate(entry.value);
    if (decoded) return { decoded, key: entry.key };
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
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const debug = isProxyDebugEnabled();
  const method = getMethod(event);
  const query = getQuery(event);
  const body = method === "GET" || method === "HEAD" ? null : await readBodyBuffer(event);
  const contentType = String(event.node.req.headers["content-type"] || "");

  if (debug) {
    const parsedForm = body && contentType.includes("application/x-www-form-urlencoded")
      ? parseFormUrlEncodedRaw(body.toString("utf8"))
      : [];
    logProxyDebug(debug, requestId, "incoming request", {
      method,
      contentType,
      bodyLength: body?.length || 0,
      formKeys: parsedForm.map((entry) => `${entry.key}:${entry.value.length}`),
    });
  }

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

  const forwardBody = target === extractTargetFromBody(body) ? stripAddressFromBody(body) : body;
  const rawBase64Payload = tryDecodeRawBase64Payload(forwardBody, contentType);

  if (rawBase64Payload) {
    headers.set("content-type", "application/octet-stream");
    logProxyDebug(debug, requestId, "detected raw base64 payload", {
      originalContentType: contentType,
      originalBytes: forwardBody?.length || 0,
      decodedBytes: rawBase64Payload.length,
    });
  }

  const upstreamBody = rawBase64Payload || forwardBody;
  logProxyDebug(debug, requestId, "forwarding to upstream", {
    method,
    target: targetUrl.toString(),
    bodyLength: upstreamBody?.length || 0,
    contentType: headers.get("content-type") || contentType,
  });

  let result = await forwardRequest(targetUrl, method, headers, upstreamBody);

  const upstreamText = result.buffer.toString("utf8");
  const isReqCorrupt = result.status === 400 && upstreamText.includes("ReqCorrupt");
  logProxyDebug(debug, requestId, "upstream response", {
    status: result.status,
    responseContentType: result.headers.get("content-type") || "",
    responseSize: result.buffer.length,
    isReqCorrupt,
  });

  if (isReqCorrupt) {
    let decodedBody = null as null | { decoded: Buffer; key?: string };

    if (!rawBase64Payload) {
      const rawDecoded = tryDecodeRawBase64Payload(forwardBody, contentType);
      if (rawDecoded) {
        decodedBody = { decoded: rawDecoded, key: "rawBody" };
      }
    }

    if (!decodedBody) {
      decodedBody = tryDecodeWrappedPayload(forwardBody, contentType);
    }

    if (decodedBody?.decoded) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("content-type", "application/octet-stream");
      logProxyDebug(debug, requestId, "retrying with decoded base64 payload", {
        payloadKey: decodedBody.key,
        payloadBytes: decodedBody.decoded.length,
      });
      result = await forwardRequest(targetUrl, method, retryHeaders, decodedBody.decoded);
      logProxyDebug(debug, requestId, "retry response", {
        status: result.status,
        responseContentType: result.headers.get("content-type") || "",
        responseSize: result.buffer.length,
      });
    } else {
      logProxyDebug(debug, requestId, "retry skipped: no base64 payload found");
    }
  }

  const shouldEncodeBase64Response = isBase64ProxyContentType(contentType) && result.status >= 200 && result.status < 300;
  if (shouldEncodeBase64Response) {
    const encoded = result.buffer.toString("base64");
    logProxyDebug(debug, requestId, "encoding upstream response to base64 for proxy client", {
      sourceBytes: result.buffer.length,
      encodedChars: encoded.length,
    });

    result = {
      ...result,
      buffer: Buffer.from(encoded, "utf8"),
      headers: new Headers(result.headers),
    };
    result.headers.set("content-type", "X-user/base64-data");
  }

  setResponseStatus(event, result.status);
  setHeader(event, "content-type", result.headers.get("content-type") || "application/octet-stream");
  setHeader(event, "cache-control", "no-store");
  return result.buffer;
});

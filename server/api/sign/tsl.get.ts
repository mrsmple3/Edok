import { defineEventHandler, getQuery, setHeader } from "h3";

const TSL_URLS: Record<string, string> = {
  dstu: "https://czo.gov.ua/download/tl/TL-UA-DSTU.xml",
  etsi: "https://czo.gov.ua/download/tl/TL-UA.xml",
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = typeof query.type === "string" ? query.type : "dstu";
  const url = TSL_URLS[type] || TSL_URLS.dstu;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download TSL (${type})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  setHeader(event, "content-type", "application/xml");
  setHeader(event, "cache-control", "public, max-age=86400");
  return buffer;
});

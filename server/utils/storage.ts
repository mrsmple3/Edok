import path from "path";

const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "..", "uploads");

const publicRoot = path.join(process.cwd(), "public");

function normalizeRelativePath(filePath: string) {
  return filePath.replace(/^\/+/, "");
}

function normalizeUploadsRelativePath(filePath: string) {
  const normalized = normalizeRelativePath(filePath);
  return normalized.startsWith("uploads/")
    ? normalized.slice("uploads/".length)
    : normalized;
}

export function getUploadsRoot() {
  return uploadsRoot;
}

export function getPublicRoot() {
  return publicRoot;
}

export function resolveUploadDir(relativeUploadDir: string) {
  return path.join(uploadsRoot, normalizeUploadsRelativePath(relativeUploadDir));
}

export function resolveStoredFilePath(filePath: string) {
  const normalized = normalizeRelativePath(filePath);

  if (normalized.startsWith("uploads/")) {
    return path.join(uploadsRoot, normalized.slice("uploads/".length));
  }

  return path.join(publicRoot, normalized);
}

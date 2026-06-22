import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadRoot = path.resolve(__dirname, '../../uploads');
const evidenceUploadDir = path.join(uploadRoot, 'evidences');
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown'
]);

export function saveEvidenceArtifact({ fileName, fileType, fileDataBase64 }) {
  if (!fileDataBase64) {
    return { url: '', fileName: '', mimeType: '', hash: '', size: 0 };
  }

  const mimeType = String(fileType || 'application/octet-stream');
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    const error = new Error('Tipo de archivo no soportado. Usa PDF, imagen o texto.');
    error.status = 400;
    throw error;
  }

  const base64 = String(fileDataBase64).replace(/^data:[^;]+;base64,/, '');
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) {
    const error = new Error('El archivo debe pesar entre 1 byte y 5 MB.');
    error.status = 400;
    throw error;
  }

  fs.mkdirSync(evidenceUploadDir, { recursive: true });
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const safeName = sanitizeFileName(fileName || `evidencia-${hash.slice(0, 10)}`);
  const extension = extensionFor(mimeType, safeName);
  const storedName = `${hash.slice(0, 16)}-${stripExtension(safeName)}${extension}`;
  const storedPath = path.join(evidenceUploadDir, storedName);
  fs.writeFileSync(storedPath, bytes);

  return {
    url: `/uploads/evidences/${storedName}`,
    fileName: safeName,
    mimeType,
    hash,
    size: bytes.length
  };
}

function sanitizeFileName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'evidencia';
}

function stripExtension(value) {
  return value.replace(/\.[a-zA-Z0-9]+$/, '').slice(0, 80) || 'archivo';
}

function extensionFor(mimeType, fileName) {
  const existing = path.extname(fileName);
  if (existing) return existing.toLowerCase();
  const map = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'text/plain': '.txt',
    'text/markdown': '.md'
  };
  return map[mimeType] ?? '.bin';
}

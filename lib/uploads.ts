import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Photo } from "./types";

export const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

const MAX_IMAGE = 15 * 1024 * 1024; // 15 MB
const MAX_PDF = 10 * 1024 * 1024; // 10 MB
const SAFE_FOLDER = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

export function isUpload(v: FormDataEntryValue | null): v is File {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as File).arrayBuffer === "function" &&
    (v as File).size > 0
  );
}

function imageExt(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return ".png";
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP")
    return ".webp";
  if (b.subarray(0, 3).toString("ascii") === "GIF") return ".gif";
  return null;
}

async function write(buf: Buffer, folder: string, ext: string, name: string): Promise<Photo> {
  if (!SAFE_FOLDER.test(folder)) throw new Error("Ruta de archivo no válida.");
  const dir = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const fname = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, fname), buf);
  return { file: `${folder}/${fname}`, name };
}

export async function saveImage(file: File, folder: string): Promise<Photo> {
  if (file.size > MAX_IMAGE) throw new Error(`La imagen "${file.name}" pesa más de 15 MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = imageExt(buf);
  if (!ext) throw new Error(`"${file.name}" no es una imagen válida (JPG, PNG, WebP o GIF).`);
  return write(buf, folder, ext, file.name);
}

export async function savePdf(file: File, folder: string): Promise<Photo> {
  if (file.size > MAX_PDF) throw new Error(`El PDF "${file.name}" pesa más de 10 MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString("ascii") !== "%PDF-")
    throw new Error(`"${file.name}" no es un PDF válido.`);
  return write(buf, folder, ".pdf", file.name);
}

function inside(target: string) {
  return target.startsWith(UPLOADS_DIR + path.sep);
}

export async function removeFiles(files: string[]) {
  for (const f of files) {
    if (!f) continue;
    const target = path.resolve(UPLOADS_DIR, f);
    if (!inside(target)) continue;
    await fs.rm(target, { force: true });
  }
}

export async function removeFolder(folder: string) {
  if (!SAFE_FOLDER.test(folder)) return;
  const target = path.resolve(UPLOADS_DIR, folder);
  if (!inside(target)) return;
  await fs.rm(target, { recursive: true, force: true });
}

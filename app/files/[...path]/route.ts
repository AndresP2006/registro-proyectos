import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

// Sirve las fotos y facturas guardadas en data/uploads
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const target = path.resolve(UPLOADS_DIR, ...segments);

  // Evita salir de la carpeta de archivos (../)
  if (!target.startsWith(UPLOADS_DIR + path.sep)) return new Response("No encontrado", { status: 404 });

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new Response("No encontrado", { status: 404 });

  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error("not a file");
    const stream = Readable.toWeb(createReadStream(target)) as unknown as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(stat.size),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

/** Reduce fotos grandes del celular (máx. 1800 px, JPEG) antes de subirlas. */
async function shrink(file: File, maxSide = 1800, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export default function PhotoPicker({ name = "photos" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  // Limpia las miniaturas cuando el formulario se reinicia tras guardar
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setPreviews([]);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    setBusy(true);
    const out = await Promise.all(files.map((f) => shrink(f)));
    const dt = new DataTransfer();
    out.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    setPreviews(out.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
    setBusy(false);
  }

  return (
    <div className="photo-picker">
      <input ref={inputRef} type="file" name={name} accept="image/*" multiple onChange={onChange} />
      {busy && <div className="hint">Optimizando fotos…</div>}
      {previews.length > 0 && (
        <div className="previews">
          {previews.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.url} src={p.url} alt={p.name} />
          ))}
        </div>
      )}
    </div>
  );
}

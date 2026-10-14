"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate, newId } from "./db";
import {
  EMPTY_MAINTENANCE,
  PAYMENT_TYPES,
  STATUSES,
  UPDATE_KINDS,
  type Photo,
  type Status,
  type UpdateKind,
} from "./types";
import { todayISO } from "./format";
import { isUpload, removeFiles, removeFolder, saveImage, savePdf } from "./uploads";

export type ActionResult = { ok: true } | { error: string };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const num = (fd: FormData, key: string) => {
  const n = Number(String(fd.get(key) ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function refresh() {
  revalidatePath("/", "layout");
}

function projectFields(fd: FormData) {
  const s = str(fd, "status") as Status;
  let siteUrl = str(fd, "siteUrl");
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) siteUrl = `https://${siteUrl}`;
  return {
    clientId: str(fd, "clientId"),
    name: str(fd, "name"),
    plan: str(fd, "plan"),
    status: STATUSES.includes(s) ? s : ("por_comenzar" as Status),
    description: str(fd, "description"),
    startDate: str(fd, "startDate"),
    dueDate: str(fd, "dueDate"),
    price: Math.max(num(fd, "price"), 0),
    siteUrl,
    hosting: str(fd, "hosting"),
    domainExpiry: str(fd, "domainExpiry"),
  };
}

/* ======================= Clientes ======================= */

export async function createClient(fd: FormData): Promise<ActionResult> {
  const name = str(fd, "name");
  if (!name) return { error: "El nombre del cliente es obligatorio." };
  const id = newId();
  await mutate((db) => {
    db.clients.push({
      id,
      name,
      company: str(fd, "company"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      notes: str(fd, "notes"),
      createdAt: new Date().toISOString(),
    });
  });
  refresh();
  redirect(`/clientes/${id}`);
}

export async function updateClient(id: string, fd: FormData): Promise<ActionResult> {
  const name = str(fd, "name");
  if (!name) return { error: "El nombre del cliente es obligatorio." };
  await mutate((db) => {
    const c = db.clients.find((x) => x.id === id);
    if (!c) return;
    c.name = name;
    c.company = str(fd, "company");
    c.email = str(fd, "email");
    c.phone = str(fd, "phone");
    c.notes = str(fd, "notes");
  });
  refresh();
  return { ok: true };
}

export async function deleteClient(id: string): Promise<void> {
  const deleted = await mutate((db) => {
    // Protección: no se borra un cliente que todavía tiene proyectos
    if (db.projects.some((p) => p.clientId === id)) return false;
    db.clients = db.clients.filter((c) => c.id !== id);
    return true;
  });
  refresh();
  if (deleted) redirect("/clientes");
}

/* ======================= Proyectos ======================= */

export async function createProject(fd: FormData): Promise<ActionResult> {
  const f = projectFields(fd);
  if (!f.name) return { error: "El nombre del proyecto es obligatorio." };
  if (!f.clientId) return { error: "Selecciona un cliente." };
  const id = newId();
  await mutate((db) => {
    db.projects.push({
      id,
      ...f,
      maintenance: { ...EMPTY_MAINTENANCE },
      payments: [],
      updates: [],
      createdAt: new Date().toISOString(),
    });
  });
  refresh();
  redirect(`/proyectos/${id}`);
}

export async function updateProject(id: string, fd: FormData): Promise<ActionResult> {
  const f = projectFields(fd);
  if (!f.name) return { error: "El nombre del proyecto es obligatorio." };
  if (!f.clientId) return { error: "Selecciona un cliente." };
  await mutate((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return;
    Object.assign(p, f);
  });
  refresh();
  return { ok: true };
}

export async function deleteProject(id: string): Promise<void> {
  await mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
  });
  await removeFolder(id); // fotos y facturas del proyecto
  refresh();
  redirect("/proyectos");
}

/* ======================= Mantenimiento ======================= */

export async function updateMaintenance(projectId: string, fd: FormData): Promise<ActionResult> {
  const active = fd.get("active") === "on";
  const fee = Math.max(num(fd, "fee"), 0);
  if (active && fee <= 0) return { error: "Indica la cuota mensual del mantenimiento." };
  const found = await mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return false;
    p.maintenance = {
      active,
      plan: str(fd, "plan") || "Básico",
      fee,
      startDate: str(fd, "startDate"),
      notes: str(fd, "notes"),
    };
    return true;
  });
  if (!found) return { error: "El proyecto ya no existe." };
  refresh();
  return { ok: true };
}

/* ======================= Bitácora de avances ======================= */

export async function addUpdate(projectId: string, fd: FormData): Promise<ActionResult> {
  const title = str(fd, "title");
  if (!title) return { error: "Escribe un título para el registro." };

  const k = str(fd, "kind") as UpdateKind;
  const kind: UpdateKind = UPDATE_KINDS.includes(k) ? k : "avance";

  let progress: number | null = null;
  const progressRaw = str(fd, "progress");
  if (progressRaw !== "") {
    const n = Number(progressRaw);
    if (!Number.isFinite(n) || n < 0 || n > 100)
      return { error: "El porcentaje de avance debe estar entre 0 y 100." };
    progress = Math.round(n);
  }

  const files = fd.getAll("photos").filter(isUpload);
  if (files.length > 12) return { error: "Máximo 12 fotos por registro." };

  const saved: Photo[] = [];
  try {
    for (const f of files) saved.push(await saveImage(f, `${projectId}/photos`));
  } catch (e) {
    await removeFiles(saved.map((s) => s.file));
    return { error: e instanceof Error ? e.message : "No se pudieron guardar las fotos." };
  }

  const found = await mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return false;
    p.updates.push({
      id: newId(),
      date: str(fd, "date") || todayISO(),
      kind,
      title,
      note: str(fd, "note"),
      progress,
      photos: saved,
      createdAt: new Date().toISOString(),
    });
    return true;
  });
  if (!found) {
    await removeFiles(saved.map((s) => s.file));
    return { error: "El proyecto ya no existe." };
  }
  refresh();
  return { ok: true };
}

export async function deleteUpdate(projectId: string, updateId: string): Promise<void> {
  const files = await mutate((db): string[] => {
    const p = db.projects.find((x) => x.id === projectId);
    const u = p?.updates.find((x) => x.id === updateId);
    if (!p || !u) return [];
    p.updates = p.updates.filter((x) => x.id !== updateId);
    return u.photos.map((x) => x.file);
  });
  await removeFiles(files);
  refresh();
}

/* ======================= Pagos (factura PDF obligatoria) ======================= */

export async function addPayment(projectId: string, fd: FormData): Promise<ActionResult> {
  const amount = num(fd, "amount");
  if (amount <= 0) return { error: "Indica un monto mayor a cero." };

  const invoice = fd.get("invoice");
  if (!isUpload(invoice))
    return { error: "Debes adjuntar la factura en PDF para poder registrar el pago." };

  let stored: Photo;
  try {
    stored = await savePdf(invoice, `${projectId}/invoices`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar la factura." };
  }

  const t = str(fd, "type");
  const type = (PAYMENT_TYPES as readonly string[]).includes(t) ? t : "Otro";

  const found = await mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return false;
    p.payments.push({
      id: newId(),
      amount,
      date: str(fd, "date") || todayISO(),
      type,
      note: str(fd, "note"),
      invoiceNumber: str(fd, "invoiceNumber"),
      invoiceFile: stored.file,
      invoiceName: stored.name,
    });
    return true;
  });
  if (!found) {
    await removeFiles([stored.file]);
    return { error: "El proyecto ya no existe." };
  }
  refresh();
  return { ok: true };
}

export async function deletePayment(projectId: string, paymentId: string): Promise<void> {
  const file = await mutate((db): string => {
    const p = db.projects.find((x) => x.id === projectId);
    const pay = p?.payments.find((x) => x.id === paymentId);
    if (!p || !pay) return "";
    p.payments = p.payments.filter((x) => x.id !== paymentId);
    return pay.invoiceFile;
  });
  await removeFiles([file]);
  refresh();
}

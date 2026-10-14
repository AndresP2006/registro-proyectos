import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { EMPTY_MAINTENANCE, type DB, type Project } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "db.json");

export const newId = () => randomUUID();

/** Completa campos nuevos en datos guardados con versiones anteriores. */
function normalizeProject(p: Partial<Project>): Project {
  return {
    id: p.id ?? newId(),
    clientId: p.clientId ?? "",
    name: p.name ?? "",
    plan: p.plan ?? "",
    status: p.status ?? "por_comenzar",
    description: p.description ?? "",
    startDate: p.startDate ?? "",
    dueDate: p.dueDate ?? "",
    price: p.price ?? 0,
    siteUrl: p.siteUrl ?? "",
    hosting: p.hosting ?? "",
    domainExpiry: p.domainExpiry ?? "",
    maintenance: { ...EMPTY_MAINTENANCE, ...(p.maintenance ?? {}) },
    payments: (p.payments ?? []).map((x) => ({
      id: x.id,
      amount: x.amount ?? 0,
      date: x.date ?? "",
      type: x.type ?? "Otro",
      note: x.note ?? "",
      invoiceNumber: x.invoiceNumber ?? "",
      invoiceFile: x.invoiceFile ?? "",
      invoiceName: x.invoiceName ?? "",
    })),
    updates: (p.updates ?? []).map((u) => ({
      ...u,
      note: u.note ?? "",
      progress: u.progress ?? null,
      photos: u.photos ?? [],
    })),
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

export async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as { clients?: DB["clients"]; projects?: Partial<Project>[] };
    return {
      clients: parsed.clients ?? [],
      projects: (parsed.projects ?? []).map(normalizeProject),
    };
  } catch {
    return { clients: [], projects: [] };
  }
}

async function writeDB(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmp, FILE); // escritura atómica
}

// Cola para que dos escrituras simultáneas no se pisen
let queue: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

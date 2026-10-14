import type { MaintState, Payment, Project } from "./types";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (n: number) => cop.format(n || 0);

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Días hasta la fecha (negativo = vencido). null si no hay fecha. */
export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export const fileUrl = (file: string) => `/files/${file}`;

export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `https://wa.me/57${digits}`;
  if (digits.length >= 11) return `https://wa.me/${digits}`;
  return null;
}

/* ---------- Dinero ---------- */

export const isMaintPayment = (x: Payment) => x.type === "Mantenimiento";

/** Pagado contra el precio del proyecto (excluye mantenimiento). */
export const paidOf = (p: Project) =>
  p.payments.filter((x) => !isMaintPayment(x)).reduce((s, x) => s + x.amount, 0);

export const maintPaidOf = (p: Project) =>
  p.payments.filter(isMaintPayment).reduce((s, x) => s + x.amount, 0);

export const pendingOf = (p: Project) => Math.max(p.price - paidOf(p), 0);

/* ---------- Progreso ---------- */

export function progressOf(p: Project): number {
  if (p.status === "terminado") return 100;
  const last = [...p.updates]
    .filter((u) => u.progress !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
  return last?.progress ?? 0;
}

export function dueLabel(p: Project): { text: string; overdue: boolean } {
  if (!p.dueDate) return { text: "Sin fecha", overdue: false };
  if (p.status === "terminado") return { text: formatDate(p.dueDate), overdue: false };
  const d = daysUntil(p.dueDate);
  if (d === null) return { text: "Sin fecha", overdue: false };
  if (d < 0) return { text: `${formatDate(p.dueDate)} · vencido hace ${-d} d`, overdue: true };
  if (d === 0) return { text: `${formatDate(p.dueDate)} · hoy`, overdue: false };
  return { text: `${formatDate(p.dueDate)} · en ${d} d`, overdue: false };
}

/* ---------- Mantenimiento ---------- */

export function maintenanceState(p: Project): MaintState {
  const m = p.maintenance;
  if (!m.active) return "inactiva";
  const month = todayISO().slice(0, 7);
  if (m.startDate && m.startDate.slice(0, 7) > month) return "programada";
  const paidThisMonth = p.payments.some((x) => isMaintPayment(x) && x.date.startsWith(month));
  return paidThisMonth ? "al_dia" : "pendiente";
}

export function lastMaintPayment(p: Project): Payment | undefined {
  return p.payments
    .filter(isMaintPayment)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

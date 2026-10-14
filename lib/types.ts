export const STATUSES = [
  "por_comenzar",
  "en_progreso",
  "en_revision",
  "terminado",
  "pausado",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  por_comenzar: "Por comenzar",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  terminado: "Terminado",
  pausado: "Pausado",
};

export const PLANS = [
  "Landing page",
  "Sitio multipágina",
  "Web con backend y base de datos",
  "Aplicación web personalizada",
  "Otro",
] as const;

export const PAYMENT_TYPES = [
  "Anticipo (50%)",
  "Pago final (50%)",
  "Mantenimiento",
  "Otro",
] as const;

export const MAINTENANCE_PLANS = [
  { name: "Básico", fee: 80000 },
  { name: "Profesional", fee: 150000 },
  { name: "Aplicación", fee: 250000 },
  { name: "Personalizado", fee: 0 },
] as const;

export const UPDATE_KINDS = [
  "avance",
  "maquetado",
  "reunion",
  "desarrollo",
  "entrega",
  "pago",
  "mantenimiento",
  "nota",
] as const;
export type UpdateKind = (typeof UPDATE_KINDS)[number];

export const UPDATE_LABEL: Record<UpdateKind, string> = {
  avance: "Avance",
  maquetado: "Maquetado",
  reunion: "Reunión / cambio",
  mantenimiento: "Mantenimiento",
  desarrollo: "Desarrollo",
  entrega: "Entrega",
  pago: "Pago",
  nota: "Nota",
};

export type MaintState = "al_dia" | "pendiente" | "programada" | "inactiva";

export const MAINT_LABEL: Record<MaintState, string> = {
  al_dia: "Al día",
  pendiente: "Pendiente de cobro",
  programada: "Programada",
  inactiva: "Sin mantenimiento",
};

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface Photo {
  file: string; // ruta relativa dentro de data/uploads
  name: string;
}

export interface ProgressUpdate {
  id: string;
  date: string; // YYYY-MM-DD
  kind: UpdateKind;
  title: string;
  note: string;
  progress: number | null; // 0-100, opcional
  photos: Photo[];
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: string;
  note: string;
  invoiceNumber: string;
  invoiceFile: string; // PDF obligatorio
  invoiceName: string;
}

export interface Maintenance {
  active: boolean;
  plan: string;
  fee: number; // COP / mes
  startDate: string;
  notes: string;
}

export const EMPTY_MAINTENANCE: Maintenance = {
  active: false,
  plan: "Básico",
  fee: 80000,
  startDate: "",
  notes: "",
};

export interface Project {
  id: string;
  clientId: string;
  name: string;
  plan: string;
  status: Status;
  description: string;
  startDate: string;
  dueDate: string;
  price: number; // COP
  siteUrl: string;
  hosting: string;
  domainExpiry: string;
  maintenance: Maintenance;
  payments: Payment[];
  updates: ProgressUpdate[];
  createdAt: string;
}

export interface DB {
  clients: Client[];
  projects: Project[];
}

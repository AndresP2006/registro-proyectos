import Link from "next/link";
import { PLANS, STATUSES, STATUS_LABEL, type Client, type Project } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";
import ActionForm from "./ActionForm";

export default function ProjectForm({
  project,
  clients,
  defaultClientId,
  action,
  submitLabel,
}: {
  project?: Project;
  clients: Client[];
  defaultClientId?: string;
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  if (clients.length === 0) {
    return (
      <div className="empty">
        <p>Primero necesitas registrar un cliente para poder asignarle proyectos.</p>
        <Link href="/clientes/nuevo" className="btn primary">
          Crear cliente
        </Link>
      </div>
    );
  }

  const selectedClient = project?.clientId ?? defaultClientId ?? "";

  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <h3 className="form-section">General</h3>
      <label>
        Nombre del proyecto *
        <input name="name" required defaultValue={project?.name} placeholder="Web para centro de estética" />
      </label>
      <div className="row">
        <label>
          Cliente *
          <select name="clientId" required defaultValue={selectedClient}>
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select name="status" defaultValue={project?.status ?? "por_comenzar"}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Descripción / alcance
        <textarea
          name="description"
          rows={4}
          defaultValue={project?.description}
          placeholder="Qué incluye, páginas, funcionalidades, textos e imágenes que aporta el cliente…"
        />
      </label>

      <h3 className="form-section">Cobro y fechas</h3>
      <div className="row">
        <label>
          Tipo de servicio
          <select name="plan" defaultValue={project?.plan ?? PLANS[0]}>
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio acordado (COP)
          <input
            name="price"
            type="number"
            min={0}
            step={1000}
            defaultValue={project?.price || ""}
            placeholder="800000"
          />
        </label>
      </div>
      <div className="row">
        <label>
          Fecha de inicio
          <input name="startDate" type="date" defaultValue={project?.startDate} />
        </label>
        <label>
          Fecha de entrega
          <input name="dueDate" type="date" defaultValue={project?.dueDate} />
        </label>
      </div>

      <h3 className="form-section">Datos técnicos</h3>
      <label>
        URL del sitio
        <input name="siteUrl" defaultValue={project?.siteUrl} placeholder="https://cliente.com" />
      </label>
      <div className="row">
        <label>
          Hosting / dominio
          <input name="hosting" defaultValue={project?.hosting} placeholder="Cloudflare Pages · dominio en Namecheap" />
        </label>
        <label>
          Vence el dominio
          <input name="domainExpiry" type="date" defaultValue={project?.domainExpiry} />
        </label>
      </div>
    </ActionForm>
  );
}

import Link from "next/link";
import { readDB } from "@/lib/db";
import { dueLabel, formatCOP, maintenanceState, paidOf, pendingOf, progressOf } from "@/lib/format";
import { STATUSES, STATUS_LABEL, type Status } from "@/lib/types";
import Icon from "@/components/Icon";
import StatusBadge, { MaintBadge } from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filter = STATUSES.includes(estado as Status) ? (estado as Status) : null;

  const { clients, projects } = await readDB();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const list = projects
    .filter((p) => !filter || p.status === filter)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Proyectos</h1>
          <p className="sub">{projects.length} en total</p>
        </div>
        <Link href="/proyectos/nuevo" className="btn primary">
          <Icon name="plus" size={16} /> Nuevo proyecto
        </Link>
      </div>

      <div className="pills">
        <Link href="/proyectos" className={!filter ? "active" : ""}>Todos ({projects.length})</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/proyectos?estado=${s}`} className={filter === s ? "active" : ""}>
            {STATUS_LABEL[s]} ({projects.filter((p) => p.status === s).length})
          </Link>
        ))}
      </div>

      <section className="card">
        {list.length === 0 ? (
          <div className="empty">No hay proyectos {filter ? "con este estado" : "todavía"}.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th><th>Estado</th><th>Progreso</th><th>Entrega</th>
                  <th className="num">Precio</th><th className="num">Pendiente</th><th>Mantenimiento</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const due = dueLabel(p);
                  const pending = pendingOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/proyectos/${p.id}`} className="cell-main">{p.name}</Link>
                        <div className="cell-sub">
                          <Link href={`/clientes/${p.clientId}`}>{clientName(p.clientId)}</Link>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td><ProgressBar value={progressOf(p)} label /></td>
                      <td className={due.overdue ? "overdue nowrap" : "nowrap"}>{due.text}</td>
                      <td className="num">{formatCOP(p.price)}<div className="cell-sub ok">{formatCOP(paidOf(p))} pagado</div></td>
                      <td className={`num ${pending > 0 ? "warn" : "muted"}`}>{formatCOP(pending)}</td>
                      <td><MaintBadge state={maintenanceState(p)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

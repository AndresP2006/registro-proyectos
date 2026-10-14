import Link from "next/link";
import { readDB } from "@/lib/db";
import {
  daysUntil,
  dueLabel,
  fileUrl,
  formatCOP,
  formatDate,
  maintenanceState,
  paidOf,
  pendingOf,
  progressOf,
} from "@/lib/format";
import { UPDATE_LABEL } from "@/lib/types";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { clients, projects } = await readDB();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const count = (...s: string[]) => projects.filter((p) => s.includes(p.status)).length;
  const totalPaid = projects.reduce((a, p) => a + paidOf(p), 0);
  const totalPending = projects.reduce((a, p) => a + pendingOf(p), 0);
  const recurring = projects
    .filter((p) => p.maintenance.active)
    .reduce((a, p) => a + p.maintenance.fee, 0);

  const upcoming = projects
    .filter((p) => p.status !== "terminado")
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 6);

  const activity = projects
    .flatMap((p) => p.updates.map((u) => ({ p, u })))
    .sort((a, b) => b.u.date.localeCompare(a.u.date) || b.u.createdAt.localeCompare(a.u.createdAt))
    .slice(0, 6);

  const overdue = projects.filter(
    (p) => p.status !== "terminado" && (daysUntil(p.dueDate) ?? 1) < 0,
  );
  const domains = projects.filter((p) => p.domainExpiry && (daysUntil(p.domainExpiry) ?? 999) <= 30);
  const maintPending = projects.filter((p) => maintenanceState(p) === "pendiente");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resumen</h1>
          <p className="sub">Estado general de tus proyectos, cobros y mantenimientos.</p>
        </div>
        <div className="actions">
          <Link href="/clientes/nuevo" className="btn">
            <Icon name="plus" size={16} /> Cliente
          </Link>
          <Link href="/proyectos/nuevo" className="btn primary">
            <Icon name="plus" size={16} /> Proyecto
          </Link>
        </div>
      </div>

      {(overdue.length > 0 || domains.length > 0 || maintPending.length > 0) && (
        <div className="alerts">
          {overdue.map((p) => (
            <div key={p.id} className="alert danger">
              <Icon name="alert" /> <span>Entrega vencida: <Link href={`/proyectos/${p.id}`}>{p.name}</Link> ({clientName(p.clientId)})</span>
            </div>
          ))}
          {domains.map((p) => (
            <div key={p.id} className="alert">
              <Icon name="alert" /> <span>El dominio de <Link href={`/proyectos/${p.id}?tab=detalles`}>{p.name}</Link> vence el {formatDate(p.domainExpiry)}</span>
            </div>
          ))}
          {maintPending.length > 0 && (
            <div className="alert">
              <Icon name="wrench" /> <span>{maintPending.length} {maintPending.length === 1 ? "mantenimiento pendiente" : "mantenimientos pendientes"} de cobro este mes. <Link href="/mantenimiento">Ver</Link></span>
            </div>
          )}
        </div>
      )}

      <section className="stats">
        <div className="stat"><div className="label">Clientes</div><div className="value">{clients.length}</div></div>
        <div className="stat"><div className="label">En desarrollo</div><div className="value">{count("en_progreso", "en_revision")}</div><div className="foot">{count("por_comenzar")} por comenzar</div></div>
        <div className="stat"><div className="label">Terminados</div><div className="value">{count("terminado")}</div></div>
        <div className="stat"><div className="label">Por cobrar</div><div className="value warn">{formatCOP(totalPending)}</div></div>
        <div className="stat"><div className="label">Cobrado</div><div className="value ok">{formatCOP(totalPaid)}</div></div>
        <div className="stat"><div className="label">Mantenimiento / mes</div><div className="value">{formatCOP(recurring)}</div></div>
      </section>

      <div className="split">
        <section className="card">
          <div className="card-head">
            <h2>Próximas entregas</h2>
            <Link href="/proyectos">Ver todos</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="empty">No tienes proyectos pendientes.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Proyecto</th><th>Estado</th><th>Progreso</th><th>Entrega</th></tr>
                </thead>
                <tbody>
                  {upcoming.map((p) => {
                    const due = dueLabel(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/proyectos/${p.id}`} className="cell-main">{p.name}</Link>
                          <div className="cell-sub">{clientName(p.clientId)}</div>
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td><ProgressBar value={progressOf(p)} label /></td>
                        <td className={due.overdue ? "overdue" : "nowrap"}>{due.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Actividad reciente</h2></div>
          {activity.length === 0 ? (
            <div className="empty">Aquí aparecerán los avances que registres.</div>
          ) : (
            <ul className="activity">
              {activity.map(({ p, u }) => (
                <li key={u.id}>
                  {u.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="a-img" src={fileUrl(u.photos[0].file)} alt="" loading="lazy" />
                  ) : (
                    <span className="a-img"><Icon name="activity" /></span>
                  )}
                  <div className="a-body">
                    <div className="a-title">{u.title}</div>
                    <div className="cell-sub">
                      <Link href={`/proyectos/${p.id}`}>{p.name}</Link> · {UPDATE_LABEL[u.kind]} · {formatDate(u.date)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

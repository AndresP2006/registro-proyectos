import Link from "next/link";
import { readDB } from "@/lib/db";
import {
  daysUntil,
  formatCOP,
  formatDate,
  lastMaintPayment,
  maintenanceState,
} from "@/lib/format";
import { MaintBadge } from "@/components/StatusBadge";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function MantenimientoPage() {
  const { clients, projects } = await readDB();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const active = projects
    .filter((p) => p.maintenance.active)
    .sort((a, b) => {
      // primero los pendientes de cobro
      const rank = (s: string) => (s === "pendiente" ? 0 : 1);
      return rank(maintenanceState(a)) - rank(maintenanceState(b)) || a.name.localeCompare(b.name);
    });

  const recurring = active.reduce((s, p) => s + p.maintenance.fee, 0);
  const pendingList = active.filter((p) => maintenanceState(p) === "pendiente");
  const pendingSum = pendingList.reduce((s, p) => s + p.maintenance.fee, 0);

  const domains = projects
    .filter((p) => p.domainExpiry && (daysUntil(p.domainExpiry) ?? 999) <= 60)
    .sort((a, b) => a.domainExpiry.localeCompare(b.domainExpiry));

  const opportunities = projects.filter((p) => p.status === "terminado" && !p.maintenance.active);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mantenimiento</h1>
          <p className="sub">Planes mensuales activos, cobros del mes y vencimientos de dominios.</p>
        </div>
      </div>

      <section className="stats">
        <div className="stat"><div className="label">Planes activos</div><div className="value">{active.length}</div></div>
        <div className="stat"><div className="label">Ingreso mensual</div><div className="value">{formatCOP(recurring)}</div></div>
        <div className="stat"><div className="label">Pendiente este mes</div><div className="value warn">{formatCOP(pendingSum)}</div><div className="foot">{pendingList.length} {pendingList.length === 1 ? "cliente" : "clientes"}</div></div>
        <div className="stat"><div className="label">Dominios por vencer</div><div className="value">{domains.length}</div><div className="foot">en los próximos 60 días</div></div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Planes de mantenimiento</h2></div>
        {active.length === 0 ? (
          <div className="empty">
            <p>Aún no hay proyectos con mantenimiento activo.</p>
            <p className="hint">Actívalo desde la pestaña «Mantenimiento» de cada proyecto.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Proyecto</th><th>Plan</th><th className="num">Cuota</th><th>Este mes</th><th>Último pago</th></tr>
              </thead>
              <tbody>
                {active.map((p) => {
                  const last = lastMaintPayment(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/proyectos/${p.id}?tab=mantenimiento`} className="cell-main">{p.name}</Link>
                        <div className="cell-sub">{clientName(p.clientId)}</div>
                      </td>
                      <td>{p.maintenance.plan}</td>
                      <td className="num">{formatCOP(p.maintenance.fee)}</td>
                      <td><MaintBadge state={maintenanceState(p)} /></td>
                      <td className="nowrap">{last ? formatDate(last.date) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="split even" style={{ marginTop: 20 }}>
        <section className="card">
          <div className="card-head"><h2>Dominios y renovaciones</h2></div>
          {domains.length === 0 ? (
            <div className="empty">Ningún dominio vence en los próximos 60 días.</div>
          ) : (
            <ul className="activity">
              {domains.map((p) => {
                const d = daysUntil(p.domainExpiry) ?? 0;
                return (
                  <li key={p.id}>
                    <span className="a-img"><Icon name="calendar" /></span>
                    <div className="a-body">
                      <div className="a-title"><Link href={`/proyectos/${p.id}?tab=detalles`}>{p.name}</Link></div>
                      <div className={d < 0 ? "cell-sub overdue" : "cell-sub"}>
                        {d < 0 ? `Venció hace ${-d} d` : d === 0 ? "Vence hoy" : `Vence en ${d} d`} · {formatDate(p.domainExpiry)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Terminados sin mantenimiento</h2></div>
          {opportunities.length === 0 ? (
            <div className="empty">No tienes proyectos terminados sin plan.</div>
          ) : (
            <ul className="activity">
              {opportunities.map((p) => (
                <li key={p.id}>
                  <span className="a-img"><Icon name="wrench" /></span>
                  <div className="a-body">
                    <div className="a-title"><Link href={`/proyectos/${p.id}?tab=mantenimiento`}>{p.name}</Link></div>
                    <div className="cell-sub">{clientName(p.clientId)}</div>
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

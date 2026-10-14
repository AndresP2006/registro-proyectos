import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import {
  addPayment,
  addUpdate,
  deletePayment,
  deleteProject,
  updateMaintenance,
  updateProject,
} from "@/lib/actions";
import {
  dueLabel,
  fileUrl,
  formatCOP,
  formatDate,
  isMaintPayment,
  maintenanceState,
  paidOf,
  pendingOf,
  progressOf,
} from "@/lib/format";
import ProjectForm from "@/components/ProjectForm";
import StatusBadge, { MaintBadge } from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import DeleteButton from "@/components/DeleteButton";
import UpdateForm from "@/components/UpdateForm";
import PaymentForm from "@/components/PaymentForm";
import Timeline from "@/components/Timeline";
import ActionForm from "@/components/ActionForm";
import MaintenanceFields from "@/components/MaintenanceFields";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const TABS = ["avances", "pagos", "mantenimiento", "detalles"] as const;
type Tab = (typeof TABS)[number];

export default async function ProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "avances";

  const { clients, projects } = await readDB();
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const client = clients.find((c) => c.id === project.clientId);
  const paid = paidOf(project);
  const pending = pendingOf(project);
  const progress = progressOf(project);
  const due = dueLabel(project);
  const mState = maintenanceState(project);

  const payments = [...project.payments].sort((a, b) => b.date.localeCompare(a.date));
  const projectPayments = payments.filter((x) => !isMaintPayment(x));
  const maintPayments = payments.filter(isMaintPayment);
  const maintUpdates = project.updates.filter((u) => u.kind === "mantenimiento");
  const workUpdates = project.updates.filter((u) => u.kind !== "mantenimiento");

  const tabHref = (t: Tab) => `/proyectos/${id}?tab=${t}`;
  const counts: Record<Tab, number | null> = {
    avances: workUpdates.length,
    pagos: payments.length,
    mantenimiento: maintUpdates.length,
    detalles: null,
  };
  const labels: Record<Tab, string> = {
    avances: "Avances",
    pagos: "Pagos y facturas",
    mantenimiento: "Mantenimiento",
    detalles: "Detalles",
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs"><Link href="/proyectos">Proyectos</Link> / {project.name}</div>
          <h1>{project.name}</h1>
          <div className="meta-line">
            {client && <Link href={`/clientes/${client.id}`}><Icon name="users" size={15} /> {client.name}</Link>}
            {project.plan && <span><Icon name="folder" size={15} /> {project.plan}</span>}
            {project.siteUrl && (
              <a href={project.siteUrl} target="_blank" rel="noreferrer"><Icon name="link" size={15} /> {project.siteUrl.replace(/^https?:\/\//, "")}</a>
            )}
          </div>
        </div>
        <div className="actions">
          <StatusBadge status={project.status} />
          <DeleteButton
            action={deleteProject.bind(null, project.id)}
            label="Eliminar"
            confirmText="¿Eliminar este proyecto con todos sus avances, fotos, pagos y facturas? No se puede deshacer."
          />
        </div>
      </div>

      <section className="proj-summary">
        <div className="stat">
          <div className="label">Progreso</div>
          <div style={{ marginTop: 10 }}><ProgressBar value={progress} label /></div>
        </div>
        <div className="stat"><div className="label">Entrega</div><div className={`value ${due.overdue ? "overdue" : ""}`} style={{ fontSize: "0.98rem" }}>{due.text}</div></div>
        <div className="stat"><div className="label">Precio</div><div className="value">{formatCOP(project.price)}</div></div>
        <div className="stat"><div className="label">Pagado</div><div className="value ok">{formatCOP(paid)}</div></div>
        <div className="stat"><div className="label">Pendiente</div><div className={`value ${pending > 0 ? "warn" : ""}`}>{formatCOP(pending)}</div></div>
      </section>

      <nav className="tabs">
        {TABS.map((t) => (
          <Link key={t} href={tabHref(t)} className={tab === t ? "active" : ""}>
            {labels[t]}
            {counts[t] !== null && <span className="count">{counts[t]}</span>}
          </Link>
        ))}
      </nav>

      {tab === "avances" && (
        <div className="split">
          <div>
            <Timeline
              projectId={project.id}
              updates={workUpdates}
              emptyText="Aún no hay registros. Documenta cada avance con fotos o capturas para que el cliente y tú vean el progreso."
            />
          </div>
          <section className="card">
            <h2>Registrar avance</h2>
            <UpdateForm action={addUpdate.bind(null, project.id)} currentProgress={progress} />
          </section>
        </div>
      )}

      {tab === "pagos" && (
        <div className="split">
          <section className="card">
            <h2>Pagos del proyecto</h2>
            {payments.length === 0 ? (
              <div className="empty">Todavía no hay pagos. Para registrar uno debes adjuntar la factura en PDF.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Fecha</th><th>Concepto</th><th>Factura</th><th className="num">Monto</th><th /></tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id}>
                        <td className="nowrap">{formatDate(pay.date)}</td>
                        <td>
                          <div className="cell-main">{pay.type}</div>
                          {pay.note && <div className="cell-sub">{pay.note}</div>}
                        </td>
                        <td>
                          {pay.invoiceFile ? (
                            <a className="invoice-link" href={fileUrl(pay.invoiceFile)} target="_blank" rel="noreferrer">
                              <Icon name="file" size={16} /> {pay.invoiceNumber || "Ver PDF"}
                            </a>
                          ) : (
                            <span className="muted">Sin PDF</span>
                          )}
                        </td>
                        <td className="num ok">{formatCOP(pay.amount)}</td>
                        <td className="num">
                          <DeleteButton
                            small
                            ghost
                            label="Quitar"
                            confirmText="¿Quitar este pago y su factura?"
                            action={deletePayment.bind(null, project.id, pay.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="card">
            <h2>Registrar pago</h2>
            <PaymentForm
              action={addPayment.bind(null, project.id)}
              suggestedAmount={pending > 0 ? pending : undefined}
              isFirst={projectPayments.length === 0}
            />
          </section>
        </div>
      )}

      {tab === "mantenimiento" && (
        <div className="split">
          <div className="stack">
            <section className="card">
              <div className="card-head">
                <h2>Estado del mantenimiento</h2>
                <MaintBadge state={mState} />
              </div>
              {project.maintenance.active ? (
                <dl className="kv">
                  <dt>Plan</dt><dd>{project.maintenance.plan}</dd>
                  <dt>Cuota mensual</dt><dd>{formatCOP(project.maintenance.fee)}</dd>
                  <dt>Desde</dt><dd>{formatDate(project.maintenance.startDate)}</dd>
                  <dt>Total cobrado</dt><dd className="ok">{formatCOP(maintPayments.reduce((s, x) => s + x.amount, 0))}</dd>
                </dl>
              ) : (
                <p className="muted" style={{ margin: 0 }}>Este proyecto no tiene mantenimiento activo. Configúralo a la derecha.</p>
              )}
              {maintPayments.length > 0 && (
                <>
                  <h2 style={{ marginTop: 20 }}>Cuotas pagadas</h2>
                  <div className="table-wrap">
                    <table>
                      <tbody>
                        {maintPayments.map((pay) => (
                          <tr key={pay.id}>
                            <td className="nowrap">{formatDate(pay.date)}</td>
                            <td>
                              {pay.invoiceFile ? (
                                <a className="invoice-link" href={fileUrl(pay.invoiceFile)} target="_blank" rel="noreferrer">
                                  <Icon name="file" size={16} /> {pay.invoiceNumber || "Factura"}
                                </a>
                              ) : "—"}
                            </td>
                            <td className="num ok">{formatCOP(pay.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <p className="hint" style={{ marginTop: 14 }}>
                Para cobrar una cuota ve a <Link href={tabHref("pagos")}>Pagos y facturas</Link> y elige el tipo «Mantenimiento».
              </p>
            </section>

            <div>
              <h2>Trabajos realizados</h2>
              <Timeline
                projectId={project.id}
                updates={maintUpdates}
                emptyText="Aún no registras trabajos de mantenimiento (cambios, copias de seguridad, correcciones…)."
              />
            </div>
          </div>

          <div className="stack">
            <section className="card">
              <h2>Configurar mantenimiento</h2>
              <ActionForm action={updateMaintenance.bind(null, project.id)} submitLabel="Guardar configuración">
                <MaintenanceFields initial={project.maintenance} />
              </ActionForm>
            </section>
            <section className="card">
              <h2>Registrar trabajo</h2>
              <UpdateForm
                action={addUpdate.bind(null, project.id)}
                defaultKind="mantenimiento"
                lockKind
                submitLabel="Guardar trabajo"
              />
            </section>
          </div>
        </div>
      )}

      {tab === "detalles" && (
        <section className="card" style={{ maxWidth: 760 }}>
          <ProjectForm
            project={project}
            clients={clients}
            action={updateProject.bind(null, project.id)}
            submitLabel="Guardar cambios"
          />
        </section>
      )}
    </>
  );
}

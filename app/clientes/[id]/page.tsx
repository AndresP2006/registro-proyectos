import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import { deleteClient, updateClient } from "@/lib/actions";
import {
  dueLabel,
  formatCOP,
  maintenanceState,
  paidOf,
  pendingOf,
  progressOf,
  whatsappUrl,
} from "@/lib/format";
import ClientForm from "@/components/ClientForm";
import StatusBadge, { MaintBadge } from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import DeleteButton from "@/components/DeleteButton";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clients, projects } = await readDB();
  const client = clients.find((c) => c.id === id);
  if (!client) notFound();

  const mine = projects.filter((p) => p.clientId === id);
  const total = mine.reduce((a, p) => a + p.price, 0);
  const paid = mine.reduce((a, p) => a + paidOf(p), 0);
  const pending = mine.reduce((a, p) => a + pendingOf(p), 0);
  const monthly = mine.filter((p) => p.maintenance.active).reduce((a, p) => a + p.maintenance.fee, 0);
  const wa = whatsappUrl(client.phone);

  return (
    <>
      <div className="page-head">
        <div className="person" style={{ gap: 14 }}>
          <Avatar name={client.name} size={52} />
          <div>
            <div className="crumbs"><Link href="/clientes">Clientes</Link> / {client.name}</div>
            <h1>{client.name}</h1>
            <div className="meta-line">
              {client.company && <span>{client.company}</span>}
              {client.phone && (wa ? <a href={wa} target="_blank" rel="noreferrer"><Icon name="phone" size={15} /> {client.phone}</a> : <span><Icon name="phone" size={15} /> {client.phone}</span>)}
              {client.email && <a href={`mailto:${client.email}`}><Icon name="mail" size={15} /> {client.email}</a>}
            </div>
          </div>
        </div>
        <div className="actions">
          <Link href={`/proyectos/nuevo?cliente=${client.id}`} className="btn primary">
            <Icon name="plus" size={16} /> Proyecto para este cliente
          </Link>
          {mine.length === 0 && (
            <DeleteButton
              action={deleteClient.bind(null, client.id)}
              label="Eliminar"
              confirmText="¿Eliminar este cliente?"
            />
          )}
        </div>
      </div>

      <section className="stats">
        <div className="stat"><div className="label">Total acordado</div><div className="value">{formatCOP(total)}</div></div>
        <div className="stat"><div className="label">Pagado</div><div className="value ok">{formatCOP(paid)}</div></div>
        <div className="stat"><div className="label">Te debe</div><div className="value warn">{formatCOP(pending)}</div></div>
        <div className="stat"><div className="label">Mantenimiento / mes</div><div className="value">{formatCOP(monthly)}</div></div>
      </section>

      <div className="split">
        <section className="card">
          <div className="card-head"><h2>Proyectos ({mine.length})</h2></div>
          {mine.length === 0 ? (
            <div className="empty">Este cliente aún no tiene proyectos.</div>
          ) : (
            mine.map((p) => {
              const due = dueLabel(p);
              return (
                <Link key={p.id} href={`/proyectos/${p.id}`} className="proj-card">
                  <div className="top">
                    <span className="cell-main">{p.name}</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <StatusBadge status={p.status} />
                      {p.maintenance.active && <MaintBadge state={maintenanceState(p)} />}
                    </span>
                  </div>
                  <ProgressBar value={progressOf(p)} label />
                  <div className="cell-sub" style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span className={due.overdue ? "overdue" : ""}>Entrega: {due.text}</span>
                    <span>
                      {formatCOP(p.price)} · <span className={pendingOf(p) > 0 ? "warn" : "ok"}>debe {formatCOP(pendingOf(p))}</span>
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </section>

        <section className="card">
          <h2>Datos del cliente</h2>
          <ClientForm client={client} action={updateClient.bind(null, client.id)} submitLabel="Guardar cambios" />
          {mine.length > 0 && (
            <p className="hint" style={{ marginTop: 12 }}>
              Para eliminar este cliente primero elimina sus proyectos.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import { readDB } from "@/lib/db";
import { formatCOP, paidOf, pendingOf } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const { clients, projects } = await readDB();

  const rows = clients
    .map((c) => {
      const mine = projects.filter((p) => p.clientId === c.id);
      return {
        client: c,
        count: mine.length,
        active: mine.filter((p) => p.status !== "terminado").length,
        total: mine.reduce((a, p) => a + p.price, 0),
        paid: mine.reduce((a, p) => a + paidOf(p), 0),
        pending: mine.reduce((a, p) => a + pendingOf(p), 0),
      };
    })
    .sort((a, b) => b.pending - a.pending);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <p className="sub">{clients.length} registrados · ordenados por lo que te deben</p>
        </div>
        <Link href="/clientes/nuevo" className="btn primary">
          <Icon name="plus" size={16} /> Nuevo cliente
        </Link>
      </div>

      <section className="card">
        {rows.length === 0 ? (
          <div className="empty">Aún no tienes clientes registrados.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th><th>Contacto</th><th className="num">Proyectos</th>
                  <th className="num">Total acordado</th><th className="num">Pagado</th><th className="num">Te deben</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client: c, count, active, total, paid, pending }) => (
                  <tr key={c.id}>
                    <td>
                      <div className="person">
                        <Avatar name={c.name} />
                        <div>
                          <Link href={`/clientes/${c.id}`} className="cell-main">{c.name}</Link>
                          {c.company && <div className="cell-sub">{c.company}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{c.phone || c.email || "—"}</td>
                    <td className="num">{count}{active > 0 && <div className="cell-sub">{active} activos</div>}</td>
                    <td className="num">{formatCOP(total)}</td>
                    <td className="num ok">{formatCOP(paid)}</td>
                    <td className={`num ${pending > 0 ? "warn" : "muted"}`}>{formatCOP(pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

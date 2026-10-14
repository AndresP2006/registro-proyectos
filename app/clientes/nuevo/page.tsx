import { createClient } from "@/lib/actions";
import ClientForm from "@/components/ClientForm";

export default function NuevoCliente() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs">Clientes / Nuevo</div>
          <h1>Nuevo cliente</h1>
        </div>
      </div>
      <section className="card" style={{ maxWidth: 640 }}>
        <ClientForm action={createClient} submitLabel="Crear cliente" />
      </section>
    </>
  );
}

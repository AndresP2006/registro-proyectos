import { readDB } from "@/lib/db";
import { createProject } from "@/lib/actions";
import ProjectForm from "@/components/ProjectForm";

export const dynamic = "force-dynamic";

export default async function NuevoProyecto({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const { clients } = await readDB();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs">Proyectos / Nuevo</div>
          <h1>Nuevo proyecto</h1>
        </div>
      </div>
      <section className="card" style={{ maxWidth: 760 }}>
        <ProjectForm
          clients={clients}
          defaultClientId={cliente}
          action={createProject}
          submitLabel="Crear proyecto"
        />
      </section>
    </>
  );
}

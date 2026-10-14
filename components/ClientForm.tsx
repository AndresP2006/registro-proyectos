import type { Client } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";
import ActionForm from "./ActionForm";

export default function ClientForm({
  client,
  action,
  submitLabel,
}: {
  client?: Client;
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <label>
        Nombre *
        <input name="name" required defaultValue={client?.name} />
      </label>
      <label>
        Empresa / negocio
        <input name="company" defaultValue={client?.company} />
      </label>
      <div className="row">
        <label>
          WhatsApp / teléfono
          <input name="phone" defaultValue={client?.phone} placeholder="3001234567" />
        </label>
        <label>
          Correo
          <input name="email" type="email" defaultValue={client?.email} />
        </label>
      </div>
      <label>
        Notas
        <textarea name="notes" rows={4} defaultValue={client?.notes} />
      </label>
    </ActionForm>
  );
}

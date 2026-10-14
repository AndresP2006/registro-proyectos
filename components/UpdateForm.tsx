import { UPDATE_KINDS, UPDATE_LABEL, type UpdateKind } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";
import { todayISO } from "@/lib/format";
import ActionForm from "./ActionForm";
import PhotoPicker from "./PhotoPicker";

export default function UpdateForm({
  action,
  defaultKind = "avance",
  lockKind = false,
  currentProgress,
  submitLabel = "Guardar registro",
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  defaultKind?: UpdateKind;
  lockKind?: boolean;
  currentProgress?: number;
  submitLabel?: string;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={submitLabel}
      pendingLabel="Subiendo…"
      successMessage="Registro guardado"
      resetOnSuccess
    >
      <div className="row">
        {lockKind ? (
          <input type="hidden" name="kind" value={defaultKind} />
        ) : (
          <label>
            Tipo
            <select name="kind" defaultValue={defaultKind}>
              {UPDATE_KINDS.filter((k) => k !== "mantenimiento").map((k) => (
                <option key={k} value={k}>
                  {UPDATE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Fecha
          <input name="date" type="date" defaultValue={todayISO()} />
        </label>
      </div>
      <label>
        Título *
        <input name="title" required placeholder="Diseño de la página de inicio terminado" />
      </label>
      <label>
        Detalle
        <textarea name="note" rows={4} placeholder="Qué hiciste, qué falta, qué pidió el cliente…" />
      </label>
      {!lockKind && (
        <label>
          Progreso total del proyecto (%)
          <input
            name="progress"
            type="number"
            min={0}
            max={100}
            placeholder={currentProgress !== undefined ? `Actual: ${currentProgress}` : "0 - 100"}
          />
        </label>
      )}
      <label>
        Fotos / capturas
        <PhotoPicker />
      </label>
    </ActionForm>
  );
}

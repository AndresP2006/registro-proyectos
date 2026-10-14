import { PAYMENT_TYPES } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";
import { todayISO } from "@/lib/format";
import ActionForm from "./ActionForm";

export default function PaymentForm({
  action,
  suggestedAmount,
  isFirst,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  suggestedAmount?: number;
  isFirst: boolean;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel="Registrar pago"
      pendingLabel="Subiendo factura…"
      successMessage="Pago registrado"
      resetOnSuccess
    >
      <div className="row">
        <label>
          Monto (COP) *
          <input name="amount" type="number" min={1} step={1000} required defaultValue={suggestedAmount || undefined} />
        </label>
        <label>
          Tipo
          <select name="type" defaultValue={isFirst ? PAYMENT_TYPES[0] : PAYMENT_TYPES[1]}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          Fecha del pago
          <input name="date" type="date" defaultValue={todayISO()} />
        </label>
        <label>
          N° de factura
          <input name="invoiceNumber" placeholder="FAC-001" />
        </label>
      </div>
      <label>
        Factura en PDF *
        <input name="invoice" type="file" accept="application/pdf,.pdf" required />
        <span className="hint">Obligatoria para registrar el pago. Máx. 10 MB.</span>
      </label>
      <label>
        Nota
        <input name="note" placeholder="Nequi, transferencia Bancolombia…" />
      </label>
      <p className="hint">Los pagos de tipo «Mantenimiento» no descuentan del precio del proyecto.</p>
    </ActionForm>
  );
}

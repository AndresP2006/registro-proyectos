"use client";

import { useState } from "react";
import { MAINTENANCE_PLANS, type Maintenance } from "@/lib/types";

export default function MaintenanceFields({ initial }: { initial: Maintenance }) {
  const [plan, setPlan] = useState(initial.plan);
  const [fee, setFee] = useState(String(initial.fee || ""));

  function onPlan(next: string) {
    setPlan(next);
    const found = MAINTENANCE_PLANS.find((p) => p.name === next);
    if (found && found.fee > 0) setFee(String(found.fee));
  }

  return (
    <>
      <label className="check">
        <input type="checkbox" name="active" defaultChecked={initial.active} />
        <span>Este proyecto tiene mantenimiento mensual activo</span>
      </label>
      <div className="row">
        <label>
          Plan
          <select name="plan" value={plan} onChange={(e) => onPlan(e.target.value)}>
            {MAINTENANCE_PLANS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cuota mensual (COP)
          <input
            name="fee"
            type="number"
            min={0}
            step={5000}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </label>
      </div>
      <label>
        Inicio del mantenimiento
        <input name="startDate" type="date" defaultValue={initial.startDate} />
      </label>
      <label>
        Qué incluye
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial.notes}
          placeholder="Cambios menores, copias de seguridad, monitoreo, soporte por WhatsApp…"
        />
      </label>
    </>
  );
}

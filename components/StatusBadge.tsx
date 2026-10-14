import { MAINT_LABEL, STATUS_LABEL, type MaintState, type Status } from "@/lib/types";

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function MaintBadge({ state }: { state: MaintState }) {
  return <span className={`badge mb-${state}`}>{MAINT_LABEL[state]}</span>;
}

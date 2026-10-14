import { UPDATE_LABEL, type ProgressUpdate } from "@/lib/types";
import { deleteUpdate } from "@/lib/actions";
import { fileUrl, formatDate } from "@/lib/format";
import DeleteButton from "./DeleteButton";

export default function Timeline({
  projectId,
  updates,
  emptyText,
}: {
  projectId: string;
  updates: ProgressUpdate[];
  emptyText: string;
}) {
  if (updates.length === 0) return <div className="empty">{emptyText}</div>;

  const sorted = [...updates].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <ol className="timeline">
      {sorted.map((u) => (
        <li key={u.id} className={`tl-item kind-${u.kind}`}>
          <span className="tl-dot" />
          <div className="tl-card">
            <div className="tl-head">
              <div className="tl-meta">
                <span className={`kind kind-${u.kind}`}>{UPDATE_LABEL[u.kind]}</span>
                <span className="muted">{formatDate(u.date)}</span>
                {u.progress !== null && <span className="chip">{u.progress}% del proyecto</span>}
              </div>
              <DeleteButton
                small
                ghost
                label="Eliminar"
                confirmText="¿Eliminar este registro y sus fotos?"
                action={deleteUpdate.bind(null, projectId, u.id)}
              />
            </div>
            <h3>{u.title}</h3>
            {u.note && <p className="note">{u.note}</p>}
            {u.photos.length > 0 && (
              <div className="gallery">
                {u.photos.map((ph) => (
                  <a key={ph.file} href={fileUrl(ph.file)} target="_blank" rel="noreferrer" className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(ph.file)} alt={ph.name} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

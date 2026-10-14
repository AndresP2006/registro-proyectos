"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

type Result = { ok: true } | { error: string } | void;

export default function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Guardando…",
  successMessage = "Guardado",
  resetOnSuccess = false,
  className = "form",
}: {
  action: (fd: FormData) => Promise<Result>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await action(fd);
        if (res && "error" in res) {
          setError(res.error);
          return;
        }
        setSaved(true);
        if (resetOnSuccess) form.reset();
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setError("No se pudo guardar. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
        {saved && <span className="saved">✓ {successMessage}</span>}
      </div>
    </form>
  );
}

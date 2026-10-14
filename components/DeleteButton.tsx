"use client";

export default function DeleteButton({
  action,
  label = "Eliminar",
  confirmText = "¿Seguro que quieres eliminar esto?",
  small = false,
  ghost = false,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  small?: boolean;
  ghost?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className={`btn danger${small ? " small" : ""}${ghost ? " ghost" : ""}`}>
        {label}
      </button>
    </form>
  );
}

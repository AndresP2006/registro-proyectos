# Panel de proyectos web

App en **Next.js 15 (App Router) + TypeScript** para llevar el control de tus proyectos, clientes, pagos, avances y mantenimientos. Sin base de datos externa.

## Cómo correrla

```bash
npm install
npm run dev
```

Abre http://localhost:3000 · Producción: `npm run build && npm start`

## Qué incluye

- **Resumen**: alertas (entregas vencidas, dominios por vencer, mantenimientos sin cobrar), totales y actividad reciente.
- **Proyectos**: estado, progreso %, fechas, precio en COP, URL del sitio, hosting y vencimiento del dominio.
  Cada proyecto tiene 4 pestañas:
  - **Avances**: bitácora con fecha, detalle y **fotos/capturas** (se reducen automáticamente antes de subir).
  - **Pagos y facturas**: cada pago **exige una factura en PDF**; queda enlazada al pago.
  - **Mantenimiento**: plan mensual, cuota, cuotas cobradas y trabajos realizados con fotos.
  - **Detalles**: edición de toda la información del proyecto.
- **Clientes**: contacto (con enlace a WhatsApp), proyectos, total acordado, pagado y lo que te deben.
- **Mantenimiento**: planes activos, ingreso mensual, cobros pendientes del mes, dominios por vencer y proyectos terminados sin plan.

## Dónde se guardan los datos

- `data/db.json` → clientes, proyectos, pagos y bitácora.
- `data/uploads/` → fotos y facturas PDF (una carpeta por proyecto).
- Ambos están en `.gitignore`. **Respalda la carpeta `data/` completa** de vez en cuando.

## Notas

- No tiene login: úsala en tu computador. Si la publicas en internet, protégela antes (los archivos de `/files/...` también son accesibles sin sesión).
- La capa de datos está aislada en `lib/db.ts` y `lib/actions.ts` por si más adelante migras a PostgreSQL + Prisma.

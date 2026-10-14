import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir varias fotos y facturas PDF en una sola acción
    serverActions: { bodySizeLimit: "40mb" },
  },
};

export default nextConfig;

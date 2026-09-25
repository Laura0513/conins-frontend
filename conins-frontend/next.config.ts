import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",              // genera archivos estáticos en /out
  images: { unoptimized: true }, // requerido para export estático
};

export default nextConfig;
